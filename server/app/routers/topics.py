import json
import logging
from uuid import UUID

from fastapi import APIRouter, HTTPException

from app.models.schemas import (
    CreateSubtopicsAIResponse,
    CreateSubtopicsRequest,
    CreateTopicAIResponse,
    CreateTopicRequest,
    ExpandNodeAIResponse,
    ExpandNodeRequest,
)
from app.services.ai import (
    create_subtopics,
    expand_node,
    generate_topic,
    suggest_subtopics,
)
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
    from datetime import datetime, timezone

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

    # Build ancestor chain with cycle detection
    ancestors = []
    current = node
    visited = {node["id"]}
    while current.get("parent_id"):
        if current["parent_id"] in visited:
            logger.error("Cycle in node ancestry: %s", current["parent_id"])
            break
        if len(ancestors) >= 10:
            break
        visited.add(current["parent_id"])
        parent_result = supabase.table("nodes").select("id,label,parent_id").eq(
            "id", current["parent_id"]
        ).maybe_single().execute()
        if not parent_result or not parent_result.data:
            break
        ancestors.insert(0, parent_result.data["label"])
        current = parent_result.data
    ancestor_path = " > ".join([*ancestors, node["label"]])

    # Call Claude AI FIRST (before creating version — avoid orphaned versions on failure)
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

    # Create version snapshot (pre-mutation state) — only after AI succeeds
    all_nodes_result = supabase.table("nodes").select("*").eq(
        "topic_id", topic_id_str
    ).execute()

    version_result = supabase.table("versions").insert({
        "topic_id": topic_id_str,
        "snapshot": json.dumps(all_nodes_result.data),
        "action": "expand",
    }).execute()
    version_id = version_result.data[0]["id"]

    # Update node
    try:
        supabase.table("nodes").update({
            "summary": ai_response.summary,
            "sources": json.dumps([s.model_dump() for s in ai_response.sources]),
            "version_id": version_id,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }).eq("id", node_id_str).execute()
    except Exception as e:
        logger.error("Failed to update node %s: %s", node_id_str, e)
        try:
            supabase.table("versions").delete().eq("id", version_id).execute()
        except Exception as cleanup_err:
            logger.error("Failed to clean up version %s: %s", version_id, cleanup_err)
        raise HTTPException(status_code=500, detail="Failed to save expanded content")

    # Return updated node (fallback to constructed response if re-fetch fails)
    updated = supabase.table("nodes").select("*").eq(
        "id", node_id_str
    ).maybe_single().execute()

    if updated and updated.data:
        return updated.data

    logger.warning("Failed to re-fetch node %s after expand, returning constructed response", node_id_str)
    node["summary"] = ai_response.summary
    node["sources"] = json.dumps([s.model_dump() for s in ai_response.sources])
    node["version_id"] = version_id
    return node


@router.post("/{topic_id}/nodes/{node_id}/suggest-subtopics")
def suggest_node_subtopics(topic_id: UUID, node_id: UUID):
    """Suggest 3 subtopics for a node."""
    supabase = get_supabase()
    topic_id_str = str(topic_id)
    node_id_str = str(node_id)

    # Fetch node
    node_result = supabase.table("nodes").select("*").eq(
        "id", node_id_str
    ).eq("topic_id", topic_id_str).maybe_single().execute()

    if not node_result or not node_result.data:
        raise HTTPException(status_code=404, detail="Node not found")

    node = node_result.data

    # Depth check
    if node["depth"] >= 4:
        raise HTTPException(status_code=422, detail="Cannot add subtopics to maximum-depth nodes")

    # Fetch topic title
    topic_result = supabase.table("topics").select("title").eq(
        "id", topic_id_str
    ).maybe_single().execute()

    if not topic_result or not topic_result.data:
        raise HTTPException(status_code=404, detail="Topic not found")

    # Build ancestor path
    ancestors = []
    current = node
    visited = {node["id"]}
    while current.get("parent_id"):
        if current["parent_id"] in visited or len(ancestors) >= 10:
            break
        visited.add(current["parent_id"])
        parent_result = supabase.table("nodes").select("id,label,parent_id").eq(
            "id", current["parent_id"]
        ).maybe_single().execute()
        if not parent_result or not parent_result.data:
            break
        ancestors.insert(0, parent_result.data["label"])
        current = parent_result.data

    ancestor_path = " > ".join([*ancestors, node["label"]])

    # Fetch existing children labels
    children_result = supabase.table("nodes").select("label").eq(
        "parent_id", node_id_str
    ).execute()
    existing_children = [c["label"] for c in children_result.data]

    # Call AI
    try:
        suggestions = suggest_subtopics(
            topic_title=topic_result.data["title"],
            ancestor_path=ancestor_path,
            node_label=node["label"],
            node_summary=node["summary"],
            existing_children=existing_children,
        )
    except ValueError as e:
        raise HTTPException(status_code=502, detail=str(e))
    except Exception as e:
        logger.error("Suggest subtopics failed: %s", e)
        raise HTTPException(status_code=502, detail="Failed to generate suggestions")

    return {"suggestions": suggestions}


@router.post("/{topic_id}/nodes/{node_id}/subtopics", status_code=201)
def create_node_subtopics(
    topic_id: UUID, node_id: UUID, request: CreateSubtopicsRequest
):
    """Create subtopics as child nodes."""
    from datetime import datetime, timezone

    supabase = get_supabase()
    topic_id_str = str(topic_id)
    node_id_str = str(node_id)

    # Fetch node
    node_result = supabase.table("nodes").select("*").eq(
        "id", node_id_str
    ).eq("topic_id", topic_id_str).maybe_single().execute()

    if not node_result or not node_result.data:
        raise HTTPException(status_code=404, detail="Node not found")

    node = node_result.data
    child_depth = node["depth"] + 1

    if child_depth > 4:
        raise HTTPException(status_code=422, detail="Cannot add subtopics to maximum-depth nodes")

    # Fetch topic title
    topic_result = supabase.table("topics").select("title").eq(
        "id", topic_id_str
    ).maybe_single().execute()

    if not topic_result or not topic_result.data:
        raise HTTPException(status_code=404, detail="Topic not found")

    # Build ancestor path
    ancestors = []
    current = node
    visited = {node["id"]}
    while current.get("parent_id"):
        if current["parent_id"] in visited or len(ancestors) >= 10:
            break
        visited.add(current["parent_id"])
        parent_result = supabase.table("nodes").select("id,label,parent_id").eq(
            "id", current["parent_id"]
        ).maybe_single().execute()
        if not parent_result or not parent_result.data:
            break
        ancestors.insert(0, parent_result.data["label"])
        current = parent_result.data

    ancestor_path = " > ".join([*ancestors, node["label"]])

    # Fetch existing children labels for deduplication context
    existing_result = supabase.table("nodes").select("label,sort_order").eq(
        "parent_id", node_id_str
    ).execute()
    existing_siblings = [c["label"] for c in existing_result.data]
    max_sort = max((c["sort_order"] for c in existing_result.data), default=-1)

    # Call AI FIRST (before version — no orphaned versions on failure)
    try:
        children_data = create_subtopics(
            topic_title=topic_result.data["title"],
            ancestor_path=ancestor_path,
            node_label=node["label"],
            node_summary=node["summary"],
            labels=request.labels,
            parent_color=node["color"],
            existing_siblings=existing_siblings,
        )
    except ValueError as e:
        raise HTTPException(status_code=502, detail=str(e))
    except Exception as e:
        logger.error("Create subtopics AI failed: %s", e)
        raise HTTPException(status_code=502, detail="AI failed to generate subtopic content")

    # Validate
    try:
        ai_response = CreateSubtopicsAIResponse(children=children_data)
    except Exception as e:
        logger.error("Subtopics validation failed: %s\nRaw: %s", e, str(children_data)[:500])
        raise HTTPException(status_code=502, detail="AI returned invalid subtopic data")

    if len(ai_response.children) == 0:
        raise HTTPException(status_code=502, detail="AI failed to generate subtopic content")

    if len(ai_response.children) != len(request.labels):
        logger.warning(
            "AI returned %d children for %d labels. Labels: %s",
            len(ai_response.children), len(request.labels), request.labels,
        )

    # Create version snapshot (after AI success, before mutation)
    all_nodes_result = supabase.table("nodes").select("*").eq(
        "topic_id", topic_id_str
    ).execute()

    version_result = supabase.table("versions").insert({
        "topic_id": topic_id_str,
        "snapshot": json.dumps(all_nodes_result.data),
        "action": "create_subtopics",
    }).execute()
    version_id = version_result.data[0]["id"]

    # Re-query max_sort right before insert (DEC-004 — avoid stale sort_order)
    fresh_sort = supabase.table("nodes").select("sort_order").eq(
        "parent_id", node_id_str
    ).execute()
    max_sort = max((c["sort_order"] for c in fresh_sort.data), default=-1)

    # Insert child nodes
    nodes_to_insert = []
    for i, child in enumerate(ai_response.children):
        nodes_to_insert.append({
            "topic_id": topic_id_str,
            "parent_id": node_id_str,
            "version_id": version_id,
            "label": child.label,
            "emoji": child.emoji,
            "color": node["color"],  # DEC-005: server assigns parent's branch color
            "summary": child.summary,
            "depth": child_depth,
            "sort_order": max_sort + 1 + i,
            "sources": json.dumps([s.model_dump() for s in child.sources]),
        })

    try:
        insert_result = supabase.table("nodes").insert(nodes_to_insert).execute()
    except Exception as e:
        logger.error("Failed to insert subtopics: %s", e)
        try:
            supabase.table("versions").delete().eq("id", version_id).execute()
        except Exception as cleanup_err:
            logger.error("Failed to clean up version %s: %s", version_id, cleanup_err)
        raise HTTPException(status_code=500, detail="Failed to save subtopics")

    return {"nodes": insert_result.data}


@router.get("/{topic_id}/versions")
def list_versions(topic_id: UUID):
    """List version history for a topic."""
    supabase = get_supabase()
    topic_id_str = str(topic_id)

    # Verify topic exists
    topic_result = supabase.table("topics").select("id").eq(
        "id", topic_id_str
    ).maybe_single().execute()
    if not topic_result or not topic_result.data:
        raise HTTPException(status_code=404, detail="Topic not found")

    versions_result = supabase.table("versions").select(
        "id,action,created_at,snapshot"
    ).eq("topic_id", topic_id_str).order("created_at", desc=True).limit(50).execute()

    # Extract a label from each snapshot for display
    versions = []
    for v in versions_result.data:
        snapshot = v.get("snapshot")
        target_label = None
        if isinstance(snapshot, list) and len(snapshot) > 0:
            # Find the most recently modified node or the root
            target_label = snapshot[0].get("label", "")
        elif isinstance(snapshot, str):
            try:
                parsed = json.loads(snapshot)
                if isinstance(parsed, list) and len(parsed) > 0:
                    target_label = parsed[0].get("label", "")
            except (json.JSONDecodeError, TypeError):
                pass

        versions.append({
            "id": v["id"],
            "action": v["action"],
            "created_at": v["created_at"],
            "target_label": target_label,
        })

    return {"versions": versions}


@router.get("/{topic_id}/versions/{version_id}")
def get_version_snapshot(topic_id: UUID, version_id: UUID):
    """Get a version's full node snapshot."""
    supabase = get_supabase()

    version_result = supabase.table("versions").select("*").eq(
        "id", str(version_id)
    ).eq("topic_id", str(topic_id)).maybe_single().execute()

    if not version_result or not version_result.data:
        raise HTTPException(status_code=404, detail="Version not found")

    snapshot = version_result.data["snapshot"]
    if isinstance(snapshot, str):
        try:
            snapshot = json.loads(snapshot)
        except (json.JSONDecodeError, TypeError):
            snapshot = []

    return {
        "version": {
            "id": version_result.data["id"],
            "action": version_result.data["action"],
            "created_at": version_result.data["created_at"],
        },
        "nodes": snapshot,
    }


@router.post("/{topic_id}/versions/{version_id}/restore")
def restore_version(topic_id: UUID, version_id: UUID):
    """Restore a topic to a previous version."""
    from datetime import datetime, timezone

    supabase = get_supabase()
    topic_id_str = str(topic_id)
    version_id_str = str(version_id)

    # Fetch the target version
    version_result = supabase.table("versions").select("*").eq(
        "id", version_id_str
    ).eq("topic_id", topic_id_str).maybe_single().execute()

    if not version_result or not version_result.data:
        raise HTTPException(status_code=404, detail="Version not found")

    snapshot = version_result.data["snapshot"]
    if isinstance(snapshot, str):
        try:
            snapshot = json.loads(snapshot)
        except (json.JSONDecodeError, TypeError):
            raise HTTPException(status_code=500, detail="Version snapshot is corrupt")

    if not isinstance(snapshot, list) or len(snapshot) == 0:
        raise HTTPException(status_code=400, detail="Version snapshot is empty")

    # Step 1: Snapshot current state before restoring
    current_nodes = supabase.table("nodes").select("*").eq(
        "topic_id", topic_id_str
    ).execute()

    restore_version_result = supabase.table("versions").insert({
        "topic_id": topic_id_str,
        "snapshot": json.dumps(current_nodes.data),
        "action": "restore",
    }).execute()
    new_version_id = restore_version_result.data[0]["id"]

    # Step 2: Delete all current nodes (children first due to RESTRICT FK)
    try:
        for depth in [4, 3, 2, 1]:
            supabase.table("nodes").delete().eq(
                "topic_id", topic_id_str
            ).eq("depth", depth).execute()
    except Exception as e:
        logger.error("Failed to delete nodes for restore: %s", e)
        raise HTTPException(
            status_code=500,
            detail="Failed to prepare topic for restore. No content was lost.",
        )

    # Step 3: Insert nodes from snapshot with ID remapping
    snapshot.sort(key=lambda n: n.get("depth", 1))
    old_to_new_id: dict[str, str] = {}

    try:
        for node in snapshot:
            old_id = node.get("id")
            old_parent = node.get("parent_id")

            # Remap parent_id; skip nodes with unresolvable parents
            if old_parent:
                new_parent = old_to_new_id.get(old_parent)
                if new_parent is None:
                    logger.warning("Skipping node %s: parent %s not in snapshot", old_id, old_parent)
                    continue
            else:
                new_parent = None

            # Sources: pass as-is if list (Supabase handles JSONB), parse if string
            sources = node.get("sources", [])
            if isinstance(sources, str):
                try:
                    sources = json.loads(sources)
                except (json.JSONDecodeError, TypeError):
                    sources = []
            elif not isinstance(sources, list):
                sources = []

            insert_data = {
                "topic_id": topic_id_str,
                "parent_id": new_parent,
                "version_id": new_version_id,
                "label": node.get("label", ""),
                "emoji": node.get("emoji", "📄"),
                "color": node.get("color", "#4F46E5"),
                "summary": node.get("summary", ""),
                "content": node.get("content"),
                "depth": node.get("depth", 1),
                "sort_order": node.get("sort_order", 0),
                "sources": sources,
            }

            result = supabase.table("nodes").insert(insert_data).execute()
            new_id = result.data[0]["id"]
            if old_id:
                old_to_new_id[old_id] = new_id
    except Exception as e:
        logger.error("Failed to insert restored nodes: %s", e)
        # Attempt recovery: re-insert from pre-restore backup
        try:
            for depth in [4, 3, 2, 1]:
                supabase.table("nodes").delete().eq(
                    "topic_id", topic_id_str
                ).eq("depth", depth).execute()
            for orig in sorted(current_nodes.data, key=lambda n: n.get("depth", 1)):
                supabase.table("nodes").insert(orig).execute()
            logger.info("Recovery succeeded for topic %s", topic_id_str)
        except Exception as recovery_err:
            logger.error("CRITICAL: recovery also failed for topic %s: %s", topic_id_str, recovery_err)
        raise HTTPException(
            status_code=500,
            detail=f"Restore failed. Your previous state was saved as version {new_version_id}.",
        )

    # Return restored topic
    return get_topic_with_nodes(topic_id_str)


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
