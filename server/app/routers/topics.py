import json
import logging
from uuid import UUID

from fastapi import APIRouter, HTTPException

from app.models.schemas import (
    CreateTopicAIResponse,
    CreateTopicRequest,
    ExpandNodeAIResponse,
    ExpandNodeRequest,
)
from app.services.ai import expand_node, generate_topic
from app.services.database import get_supabase
from app.services.topics import get_topic_with_nodes, list_topics

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/topics", tags=["topics"])


@router.get("")
def get_topics():
    return list_topics()


@router.get("/{topic_id}")
def get_topic(topic_id: UUID):
    result = get_topic_with_nodes(str(topic_id))
    if not result:
        raise HTTPException(status_code=404, detail="Topic not found")
    return result


@router.post("", status_code=201)
def create_topic(request: CreateTopicRequest):
    """Create a new topic using Claude AI with web search."""
    # Step 0: Call Claude AI
    try:
        raw = generate_topic(request.title)
    except ValueError as e:
        raise HTTPException(status_code=502, detail=str(e))
    except Exception as e:
        logger.error("AI generation failed: %s", e)
        raise HTTPException(status_code=502, detail="AI generation failed")

    # Validate AI response
    try:
        ai_response = CreateTopicAIResponse(**raw)
    except Exception as e:
        logger.error("AI response validation failed: %s\nRaw: %s", e, str(raw)[:500])
        raise HTTPException(status_code=502, detail="AI returned an invalid response")

    supabase = get_supabase()
    topic_id = None
    version_id = None
    root_node_id = None
    child_node_ids: list[str] = []

    try:
        # Step 1: Insert topic
        topic_result = supabase.table("topics").insert({
            "title": ai_response.label,
            "emoji": ai_response.emoji,
        }).execute()
        topic_id = topic_result.data[0]["id"]

        # Step 2: Insert sentinel version
        version_result = supabase.table("versions").insert({
            "topic_id": topic_id,
            "snapshot": json.dumps({}),
            "action": "create_topic",
        }).execute()
        version_id = version_result.data[0]["id"]

        # Step 3: Insert root node (H1)
        root_result = supabase.table("nodes").insert({
            "topic_id": topic_id,
            "parent_id": None,
            "version_id": version_id,
            "label": ai_response.label,
            "emoji": ai_response.emoji,
            "color": "#4F46E5",
            "summary": ai_response.summary,
            "depth": 1,
            "sort_order": 0,
            "sources": json.dumps([s.model_dump() for s in ai_response.sources]),
        }).execute()
        root_node_id = root_result.data[0]["id"]

        # Step 4: Batch-insert child nodes (H2)
        children_data = []
        for i, child in enumerate(ai_response.children):
            children_data.append({
                "topic_id": topic_id,
                "parent_id": root_node_id,
                "version_id": version_id,
                "label": child.label,
                "emoji": child.emoji,
                "color": child.color,
                "summary": child.summary,
                "depth": 2,
                "sort_order": i,
                "sources": json.dumps([s.model_dump() for s in child.sources]),
            })

        children_result = supabase.table("nodes").insert(children_data).execute()
        child_node_ids = [n["id"] for n in children_result.data]

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Database insert failed: %s", e)
        _cleanup_partial_insert(supabase, child_node_ids, root_node_id, version_id, topic_id)
        raise HTTPException(status_code=500, detail="Failed to save topic")

    # Step 5: Populate version snapshot (non-critical — topic is usable without it)
    try:
        all_nodes = [root_result.data[0]] + children_result.data
        supabase.table("versions").update({
            "snapshot": json.dumps(all_nodes),
        }).eq("id", version_id).execute()
    except Exception as e:
        logger.warning("Failed to populate version snapshot: %s", e)

    result = get_topic_with_nodes(topic_id)
    if not result:
        logger.error("Topic %s not found immediately after creation", topic_id)
        raise HTTPException(status_code=500, detail="Topic created but could not be retrieved")
    return result


@router.post("/{topic_id}/nodes/{node_id}/expand")
def expand_topic_node(topic_id: UUID, node_id: UUID, request: ExpandNodeRequest):
    """Expand a node with richer AI-generated content."""
    supabase = get_supabase()
    topic_id_str = str(topic_id)
    node_id_str = str(node_id)

    # Fetch the node
    node_result = supabase.table("nodes").select("*").eq(
        "id", node_id_str
    ).eq("topic_id", topic_id_str).maybe_single().execute()

    if not node_result or not node_result.data:
        raise HTTPException(status_code=404, detail="Node not found")

    node = node_result.data

    # Fetch topic title
    topic_result = supabase.table("topics").select("title").eq(
        "id", topic_id_str
    ).maybe_single().execute()

    if not topic_result or not topic_result.data:
        raise HTTPException(status_code=404, detail="Topic not found")

    topic_title = topic_result.data["title"]

    # Build ancestor chain (walk parent_id to root)
    ancestors = []
    current = node
    while current.get("parent_id"):
        parent_result = supabase.table("nodes").select("id,label,parent_id").eq(
            "id", current["parent_id"]
        ).maybe_single().execute()
        if not parent_result or not parent_result.data:
            break
        ancestors.insert(0, parent_result.data["label"])
        current = parent_result.data
    ancestor_path = " > ".join([*ancestors, node["label"]])

    # Create version snapshot before mutation
    all_nodes_result = supabase.table("nodes").select("*").eq(
        "topic_id", topic_id_str
    ).execute()

    version_result = supabase.table("versions").insert({
        "topic_id": topic_id_str,
        "snapshot": json.dumps(all_nodes_result.data),
        "action": "expand",
    }).execute()
    version_id = version_result.data[0]["id"]

    # Call Claude AI
    try:
        raw = expand_node(
            topic_title=topic_title,
            ancestor_path=ancestor_path,
            current_summary=node["summary"],
            user_prompt=request.prompt,
        )
    except ValueError as e:
        raise HTTPException(status_code=502, detail=str(e))
    except Exception as e:
        logger.error("AI expand failed: %s", e)
        raise HTTPException(status_code=502, detail="AI expansion failed")

    # Validate AI response
    try:
        ai_response = ExpandNodeAIResponse(**raw)
    except Exception as e:
        logger.error("Expand validation failed: %s\nRaw: %s", e, str(raw)[:500])
        raise HTTPException(status_code=502, detail="AI returned an invalid response")

    # Update node
    from datetime import datetime, timezone

    supabase.table("nodes").update({
        "summary": ai_response.summary,
        "sources": json.dumps([s.model_dump() for s in ai_response.sources]),
        "version_id": version_id,
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }).eq("id", node_id_str).execute()

    # Return the updated node
    updated = supabase.table("nodes").select("*").eq(
        "id", node_id_str
    ).maybe_single().execute()

    return updated.data if updated and updated.data else node


def _cleanup_partial_insert(
    supabase,
    child_node_ids: list[str],
    root_node_id: str | None,
    version_id: str | None,
    topic_id: str | None,
):
    """Delete partially inserted records in reverse FK order. Each step independent."""
    if child_node_ids:
        try:
            supabase.table("nodes").delete().in_("id", child_node_ids).execute()
        except Exception as e:
            logger.error("Cleanup: failed to delete child nodes: %s", e)
    if root_node_id:
        try:
            supabase.table("nodes").delete().eq("id", root_node_id).execute()
        except Exception as e:
            logger.error("Cleanup: failed to delete root node: %s", e)
    if version_id:
        try:
            supabase.table("versions").delete().eq("id", version_id).execute()
        except Exception as e:
            logger.error("Cleanup: failed to delete version: %s", e)
    if topic_id:
        try:
            supabase.table("topics").delete().eq("id", topic_id).execute()
        except Exception as e:
            logger.error("Cleanup: failed to delete topic: %s", e)
