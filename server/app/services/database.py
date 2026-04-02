from supabase import Client, create_client

from app.config import settings

_service_client: Client | None = None


def get_supabase() -> Client:
    """Get the service_role Supabase client (bypasses RLS). Use for server-internal ops."""
    global _service_client
    if _service_client is None:
        key = settings.supabase_service_role_key
        if not key:
            if settings.environment == "production":
                raise RuntimeError("SUPABASE_SERVICE_ROLE_KEY is required in production")
            key = settings.supabase_anon_key
        _service_client = create_client(settings.supabase_url, key)
    return _service_client


def get_supabase_for_user(access_token: str) -> Client:
    """Get a Supabase client authenticated as a specific user (RLS applies)."""
    client = create_client(
        settings.supabase_url,
        settings.supabase_anon_key or settings.supabase_service_role_key,
    )
    client.auth.set_session(access_token, "")
    return client
