import logging

from fastapi import APIRouter, Depends, HTTPException

from app.auth import require_auth
from app.services.database import get_supabase

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.get("/me")
def get_me(user_id: str = Depends(require_auth)):
    """Get current authenticated user info."""
    supabase = get_supabase()
    user = supabase.auth.admin.get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {
        "id": user.user.id,
        "email": user.user.email,
    }


@router.post("/claim-topics")
def claim_unclaimed_topics(user_id: str = Depends(require_auth)):
    """Assign all topics with no user_id to the authenticated user.
    Used for migrating pre-auth data to the first authenticated user."""
    supabase = get_supabase()

    result = supabase.table("topics").update(
        {"user_id": user_id}
    ).is_("user_id", "null").execute()

    claimed = len(result.data) if result.data else 0
    logger.info("User %s claimed %d unclaimed topics", user_id, claimed)

    return {"claimed": claimed}
