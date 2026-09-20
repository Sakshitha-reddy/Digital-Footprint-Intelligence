import logging
from typing import Optional, Dict, Any, List
from app.core.config import settings

logger = logging.getLogger("neurax.supabase")

_supabase_client = None

def get_supabase():
    """Returns singleton Supabase client if configured."""
    global _supabase_client
    if _supabase_client is not None:
        return _supabase_client

    if not settings.has_supabase:
        return None

    try:
        from supabase import create_client, Client
        _supabase_client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
        logger.info(f"Connected to Supabase project: {settings.SUPABASE_URL}")
        return _supabase_client
    except Exception as e:
        logger.error(f"Failed to initialize Supabase client: {e}")
        return None

class SupabaseService:
    """Cloud persistence service using Supabase PostgreSQL & Realtime."""

    @classmethod
    def is_connected(cls) -> bool:
        return get_supabase() is not None

    @classmethod
    def get_user_by_email(cls, email: str) -> Optional[Dict[str, Any]]:
        client = get_supabase()
        if not client:
            return None
        try:
            res = client.table("users").select("*").eq("email", email.strip().lower()).execute()
            if res.data and len(res.data) > 0:
                return res.data[0]
        except Exception as e:
            logger.warning(f"Supabase get_user_by_email error: {e}")
        return None

    @classmethod
    def get_user_by_id(cls, user_id: str) -> Optional[Dict[str, Any]]:
        client = get_supabase()
        if not client:
            return None
        try:
            res = client.table("users").select("*").eq("id", user_id).execute()
            if res.data and len(res.data) > 0:
                return res.data[0]
        except Exception as e:
            logger.warning(f"Supabase get_user_by_id error: {e}")
        return None

    @classmethod
    def insert_user(cls, user_data: Dict[str, Any]) -> bool:
        client = get_supabase()
        if not client:
            return False
        try:
            client.table("users").upsert(user_data).execute()
            return True
        except Exception as e:
            logger.warning(f"Supabase insert_user error: {e}")
            return False

    @classmethod
    def update_last_login(cls, user_id: str, last_login_iso: str) -> bool:
        client = get_supabase()
        if not client:
            return False
        try:
            client.table("users").update({"last_login": last_login_iso}).eq("id", user_id).execute()
            return True
        except Exception as e:
            logger.warning(f"Supabase update_last_login error: {e}")
            return False

    @classmethod
    def update_password(cls, user_id: str, hashed_password: str, salt: str) -> bool:
        client = get_supabase()
        if not client:
            return False
        try:
            client.table("users").update({
                "hashed_password": hashed_password,
                "salt": salt
            }).eq("id", user_id).execute()
            return True
        except Exception as e:
            logger.warning(f"Supabase update_password error: {e}")
            return False

    @classmethod
    def save_investigation(cls, inv_id: str, user_id: Optional[str], data: Dict[str, Any]) -> bool:
        client = get_supabase()
        if not client:
            return False
        try:
            target = data.get("target_input", {})
            row = {
                "id": inv_id,
                "user_id": user_id,
                "target_name": target.get("name"),
                "seed_handle": target.get("seed_handle"),
                "email": target.get("email"),
                "likely_identity": data.get("likely_identity"),
                "overall_confidence": data.get("overall_confidence"),
                "data": data,
                "created_at": data.get("created_at")
            }
            client.table("investigations").upsert(row).execute()
            return True
        except Exception as e:
            logger.warning(f"Supabase save_investigation error: {e}")
            return False

class SupabaseSync:
    """Helper used by routes_auth for async user login/registration sync."""

    @classmethod
    def is_enabled(cls) -> bool:
        return settings.has_supabase and get_supabase() is not None

    @classmethod
    async def record_user_login(cls, user_id: str, email: str, full_name: str, role: str, clearance: str):
        client = get_supabase()
        if not client:
            return
        try:
            import datetime
            now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
            client.table("users").update({"last_login": now_iso}).eq("id", user_id).execute()
        except Exception as e:
            logger.debug(f"Supabase record_user_login failed: {e}")

    @classmethod
    async def record_user_registration(cls, user_id: str, email: str, full_name: str, role: str, clearance: str):
        client = get_supabase()
        if not client:
            return
        try:
            row = {
                "id": user_id,
                "email": email,
                "full_name": full_name,
                "role": role,
                "clearance": clearance,
            }
            client.table("users").upsert(row).execute()
        except Exception as e:
            logger.debug(f"Supabase record_user_registration failed: {e}")
