from app.services.database import get_supabase


def list_topics() -> list[dict]:
    """Fetch all topics with node counts, sorted by last visited."""
    supabase = get_supabase()

    # Get topics
    result = supabase.table("topics").select("*").order(
        "last_visited_at", desc=True
    ).execute()
    topics = result.data

    if not topics:
        return []

    # Get node counts per topic in one query
    counts_result = supabase.rpc(
        "get_topic_node_counts", {}
    ).execute() if False else None  # RPC not set up yet, use fallback

    # Fallback: count nodes per topic
    topic_ids = [t["id"] for t in topics]
    nodes_result = supabase.table("nodes").select(
        "topic_id", count="exact"
    ).in_("topic_id", topic_ids).execute()

    # Count nodes by topic_id
    count_map: dict[str, int] = {}
    for node in nodes_result.data:
        tid = node["topic_id"]
        count_map[tid] = count_map.get(tid, 0) + 1

    # Merge counts into topics
    for topic in topics:
        topic["nodeCount"] = count_map.get(topic["id"], 0)

    return topics


def get_topic_with_nodes(topic_id: str) -> dict | None:
    """Fetch a single topic with all its nodes."""
    supabase = get_supabase()

    topic_result = supabase.table("topics").select("*").eq(
        "id", topic_id
    ).single().execute()

    if not topic_result.data:
        return None

    nodes_result = supabase.table("nodes").select("*").eq(
        "topic_id", topic_id
    ).order("sort_order").execute()

    # Update last_visited_at
    supabase.table("topics").update(
        {"last_visited_at": "now()"}
    ).eq("id", topic_id).execute()

    return {
        "topic": topic_result.data,
        "nodes": nodes_result.data,
    }
