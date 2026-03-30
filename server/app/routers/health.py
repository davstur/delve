from fastapi import APIRouter

from app.config import settings

router = APIRouter(tags=["health"])


@router.get("/health")
async def health_check():
    return {
        "status": "ok",
        "service": "delve-api",
        "version": "0.1.0",
        "environment": settings.environment,
    }
