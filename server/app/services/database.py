from supabase import Client, create_client

from app.config import settings

_client: Client | None = None


def get_supabase() -> Client:
    global _client
    if _client is None:
        key = settings.supabase_service_role_key
        if not key:
            if settings.environment == "production":
                raise RuntimeError("SUPABASE_SERVICE_ROLE_KEY is required in production")
            key = settings.supabase_anon_key
        _client = create_client(settings.supabase_url, key)
    return _client
