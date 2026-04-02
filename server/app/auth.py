import logging
from typing import Optional

from fastapi import Header, HTTPException

from app.services.database import get_supabase

logger = logging.getLogger(__name__)


async def get_current_user_id(authorization: Optional[str] = Header(None)) -> Optional[str]:
    """Extract user ID from Supabase JWT. Returns None if no token provided."""
    if not authorization:
        return None

    token = authorization.replace("Bearer ", "") if authorization.startswith("Bearer ") else authorization

    try:
        supabase = get_supabase()
        user_response = supabase.auth.get_user(token)
        if user_response and user_response.user:
            return user_response.user.id
    except Exception as e:
        logger.warning("Failed to verify auth token: %s", e)

    return None


async def require_auth(authorization: Optional[str] = Header(None)) -> str:
    """Require authenticated user. Raises 401 if not authenticated."""
    user_id = await get_current_user_id(authorization)
    if not user_id:
        raise HTTPException(status_code=401, detail="Authentication required")
    return user_id
