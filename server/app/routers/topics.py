from uuid import UUID

from fastapi import APIRouter, HTTPException

from app.services.topics import get_topic_with_nodes, list_topics

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
