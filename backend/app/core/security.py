import hashlib
import hmac
import logging
import re
import secrets
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional

from fastapi import HTTPException, status

logger = logging.getLogger("neurax.security")

PASSWORD_MIN_LENGTH = 8


class PrivacyGuard:
    @staticmethod
    def verify_consent(consent_confirmed: bool):
        if not consent_confirmed:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Investigation requires explicit analyst consent confirming authorized OSINT target evaluation.",
            )


def validate_password(password: str) -> Optional[str]:
    if len(password) < PASSWORD_MIN_LENGTH:
        return "Password must be at least 8 characters."
    if not re.search(r"[A-Z]", password):
        return "Password must include an uppercase letter."
    if not re.search(r"[a-z]", password):
        return "Password must include a lowercase letter."
    if not re.search(r"\d", password):
        return "Password must include a number."
    if not re.search(r"[^A-Za-z0-9]", password):
        return "Password must include a special character."
    return None


def hash_password(password: str, salt: Optional[bytes] = None) -> tuple[str, str]:
    """Hash passwords with memory-hard scrypt; only the encoded hash is persisted."""
    salt_bytes = salt or secrets.token_bytes(16)
    derived = hashlib.scrypt(password.encode("utf-8"), salt=salt_bytes, n=2**15, r=8, p=1, maxmem=67108864)
    return derived.hex(), salt_bytes.hex()


def verify_password(password: str, hashed: str, salt: str) -> bool:
    try:
        calculated, _ = hash_password(password, bytes.fromhex(salt))
        return hmac.compare_digest(calculated, hashed)
    except (ValueError, TypeError):
        return False


def generate_token(size: int = 32) -> str:
    return secrets.token_urlsafe(size)


def token_digest(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def parse_expiry(value: str) -> datetime:
    return datetime.fromisoformat(value.replace("Z", "+00:00"))


def is_expired(value: str) -> bool:
    return parse_expiry(value) <= utc_now()


def create_access_token(*args, **kwargs):
    """Deprecated compatibility shim; new auth uses opaque server sessions."""
    raise RuntimeError("JWT access tokens are disabled; use server-side sessions")


def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    return None
