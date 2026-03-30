import json
import logging
from uuid import UUID

from fastapi import APIRouter, HTTPException

from app.models.schemas import CreateTopicAIResponse, CreateTopicRequest
from app.services.ai import generate_topic
from app.services.database import get_supabase
from app.services.topics import get_topic_with_nodes, list_topics

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/topics", tags=["topics"])


@router.get("")
async def get_topics():
    return list_topics()


@router.get("/{topic_id}")
async def get_topic(topic_id: UUID):
    result = get_topic_with_nodes(str(topic_id))
    if not result:
        raise HTTPException(status_code=404, detail="Topic not found")
    return result


@router.post("", status_code=201)
async def create_topic(request: CreateTopicRequest):
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

        # Step 5: Populate version snapshot with actual node tree
        all_nodes = [root_result.data[0]] + children_result.data
        supabase.table("versions").update({
            "snapshot": json.dumps(all_nodes),
        }).eq("id", version_id).execute()

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Database insert failed: %s", e)
        # Cleanup in reverse order (RESTRICT FKs prevent CASCADE)
        _cleanup_partial_insert(supabase, child_node_ids, root_node_id, version_id, topic_id)
        raise HTTPException(status_code=500, detail="Failed to save topic")

    # Return same shape as GET /api/topics/{id}
    return get_topic_with_nodes(topic_id)


def _cleanup_partial_insert(
    supabase,
    child_node_ids: list[str],
    root_node_id: str | None,
    version_id: str | None,
    topic_id: str | None,
):
    """Delete partially inserted records in reverse FK order."""
    try:
        for nid in child_node_ids:
            supabase.table("nodes").delete().eq("id", nid).execute()
        if root_node_id:
            supabase.table("nodes").delete().eq("id", root_node_id).execute()
        if version_id:
            supabase.table("versions").delete().eq("id", version_id).execute()
        if topic_id:
            supabase.table("topics").delete().eq("id", topic_id).execute()
    except Exception as cleanup_err:
        logger.error("Cleanup failed (orphaned data may exist): %s", cleanup_err)
