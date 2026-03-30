from datetime import datetime, timezone

from app.services.database import get_supabase


def list_topics() -> list[dict]:
    """Fetch all topics with node counts, sorted by last visited."""
    supabase = get_supabase()

    result = supabase.table("topics").select("*").order(
        "last_visited_at", desc=True
    ).execute()
    topics = result.data

    if not topics:
        return []

    # TODO: replace with RPC for grouped counts when performance matters
    topic_ids = [t["id"] for t in topics]
    nodes_result = supabase.table("nodes").select(
        "topic_id"
    ).in_("topic_id", topic_ids).execute()

    count_map: dict[str, int] = {}
    for node in nodes_result.data:
        tid = node["topic_id"]
        count_map[tid] = count_map.get(tid, 0) + 1

    for topic in topics:
        topic["nodeCount"] = count_map.get(topic["id"], 0)

    return topics


def get_topic_with_nodes(topic_id: str) -> dict | None:
    """Fetch a single topic with all its nodes. Updates last_visited_at."""
    supabase = get_supabase()

    topic_result = supabase.table("topics").select("*").eq(
        "id", topic_id
    ).maybe_single().execute()

    if not topic_result or not topic_result.data:
        return None

    nodes_result = supabase.table("nodes").select("*").eq(
        "topic_id", topic_id
    ).order("sort_order").execute()

    supabase.table("topics").update(
        {"last_visited_at": datetime.now(timezone.utc).isoformat()}
    ).eq("id", topic_id).execute()

    return {
        "topic": topic_result.data,
        "nodes": nodes_result.data,
    }
