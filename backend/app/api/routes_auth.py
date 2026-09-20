import logging
import re
from typing import Any, Dict, Optional
from urllib.parse import urlencode

import httpx
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from fastapi.responses import RedirectResponse
from pydantic import BaseModel, Field

from app.core.config import settings
from app.core.database import db
from app.core.email import send_password_reset
from app.core.security import hash_password, validate_password, verify_password

logger = logging.getLogger("neurax.routes_auth")
router = APIRouter()

GENERIC_INVALID_CREDENTIALS = "Invalid email or password."
GENERIC_RESET_MESSAGE = "If an account exists for this email, password reset instructions have been sent."


class UserSchema(BaseModel):
    id: str
    full_name: str
    email: str
    organization: Optional[str] = None
    avatar_url: Optional[str] = None
    email_verified: bool
    role: str
    clearance: str
    last_login_at: Optional[str] = None


class AuthResponse(BaseModel):
    user: UserSchema


class AuthConfigResponse(BaseModel):
    google_enabled: bool


class LoginRequest(BaseModel):
    email: str = Field(min_length=3, max_length=254)
    password: str = Field(min_length=1, max_length=1024)


class RegisterRequest(BaseModel):
    full_name: str = Field(min_length=2, max_length=160)
    email: str = Field(min_length=3, max_length=254)
    password: str = Field(min_length=8, max_length=1024)
    organization: Optional[str] = Field(default=None, max_length=160)


class ForgotPasswordRequest(BaseModel):
    email: str = Field(min_length=3, max_length=254)


class ResetPasswordRequest(BaseModel):
    token: str = Field(min_length=20, max_length=512)
    new_password: str = Field(min_length=8, max_length=1024)
    confirm_password: Optional[str] = Field(default=None, max_length=1024)


def normalize_email(email: str) -> str:
    clean = email.strip().lower()
    if not re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", clean):
        raise HTTPException(status_code=422, detail="Enter a valid email address.")
    return clean


def user_response(user: Dict[str, Any]) -> UserSchema:
    safe = db.public_user(user)
    return UserSchema(**safe)


def set_session_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key=settings.SESSION_COOKIE,
        value=token,
        httponly=True,
        secure=settings.SESSION_COOKIE_SECURE,
        samesite=settings.SESSION_COOKIE_SAMESITE,
        max_age=settings.SESSION_TTL_HOURS * 3600,
        path="/",
    )


def clear_session_cookie(response: Response) -> None:
    response.delete_cookie(key=settings.SESSION_COOKIE, path="/", httponly=True, secure=settings.SESSION_COOKIE_SECURE,
                           samesite=settings.SESSION_COOKIE_SAMESITE)


def create_authenticated_response(request: Request, user: Dict[str, Any], response_status: int = 200) -> Response:
    db.update_last_login(user["id"])
    refreshed = db.get_user_by_id(user["id"]) or user
    response = Response(
        content=AuthResponse(user=user_response(refreshed)).model_dump_json(),
        status_code=response_status,
        media_type="application/json",
    )
    token = db.create_session(
        user["id"], request.headers.get("user-agent"), request.client.host if request.client else None,
        settings.SESSION_TTL_HOURS,
    )
    set_session_cookie(response, token)
    return response


async def get_current_user(request: Request) -> Dict[str, Any]:
    user = db.get_session_user(request.cookies.get(settings.SESSION_COOKIE))
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required.")
    return user


@router.get("/config", response_model=AuthConfigResponse)
async def get_auth_config() -> AuthConfigResponse:
    return AuthConfigResponse(google_enabled=settings.is_google_configured)


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def register(payload: RegisterRequest, request: Request) -> Response:
    email = normalize_email(payload.email)
    full_name = " ".join(payload.full_name.split())
    if len(full_name) < 2:
        raise HTTPException(status_code=422, detail="Full name is required.")
    password_error = validate_password(payload.password)
    if password_error:
        raise HTTPException(status_code=422, detail=password_error)
    if db.get_user_by_email(email):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="An account with this email already exists.")
    password_hash, password_salt = hash_password(payload.password)
    try:
        user = db.create_user(
            email=email, full_name=full_name, password_hash=password_hash, password_salt=password_salt,
            organization=payload.organization,
        )
    except Exception as exc:
        logger.warning("Registration persistence failed: %s", exc.__class__.__name__)
        raise HTTPException(status_code=503, detail="Account creation is temporarily unavailable.") from exc
    return create_authenticated_response(request, user, status.HTTP_201_CREATED)


@router.post("/login", response_model=AuthResponse)
async def login(payload: LoginRequest, request: Request) -> Response:
    email = normalize_email(payload.email)
    user = db.get_user_by_email(email)
    # Deliberately use one generic response for missing/inactive/wrong-password states.
    if not user or not user.get("is_active") or not user.get("password_hash") or not user.get("password_salt"):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=GENERIC_INVALID_CREDENTIALS)
    if not verify_password(payload.password, user["password_hash"], user["password_salt"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=GENERIC_INVALID_CREDENTIALS)
    return create_authenticated_response(request, user)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(request: Request) -> Response:
    db.revoke_session(request.cookies.get(settings.SESSION_COOKIE))
    response = Response(status_code=status.HTTP_204_NO_CONTENT)
    clear_session_cookie(response)
    return response


@router.get("/me", response_model=UserSchema)
async def get_me(user: Dict[str, Any] = Depends(get_current_user)) -> UserSchema:
    return user_response(user)


@router.post("/refresh", response_model=AuthResponse)
async def refresh_session(request: Request, user: Dict[str, Any] = Depends(get_current_user)) -> Response:
    db.revoke_session(request.cookies.get(settings.SESSION_COOKIE))
    return create_authenticated_response(request, user)


@router.post("/forgot-password")
async def forgot_password(payload: ForgotPasswordRequest) -> Dict[str, str]:
    # Always return the same result; delivery must not reveal account existence.
    try:
        email = normalize_email(payload.email)
    except HTTPException:
        return {"message": GENERIC_RESET_MESSAGE}
    token = db.create_password_reset(email)
    if token:
        send_password_reset(email, token)
    return {"message": GENERIC_RESET_MESSAGE}


@router.post("/reset-password")
async def reset_password(payload: ResetPasswordRequest) -> Dict[str, str]:
    if payload.confirm_password is not None and payload.new_password != payload.confirm_password:
        raise HTTPException(status_code=422, detail="Passwords do not match.")
    password_error = validate_password(payload.new_password)
    if password_error:
        raise HTTPException(status_code=422, detail=password_error)
    user_id = db.consume_password_reset(payload.token)
    if not user_id:
        raise HTTPException(status_code=400, detail="Invalid or expired password reset token.")
    password_hash, password_salt = hash_password(payload.new_password)
    if not db.update_password(user_id, password_hash, password_salt):
        raise HTTPException(status_code=503, detail="Password update is temporarily unavailable.")
    db.revoke_user_sessions(user_id)
    return {"message": "Password successfully updated. Please sign in with your new password."}


@router.get("/google")
async def google_sign_in() -> RedirectResponse:
    if not settings.is_google_configured:
        raise HTTPException(status_code=503, detail="Google Sign-In is not configured.")
    state = db.create_oauth_state("google")
    query = urlencode({
        "client_id": settings.GOOGLE_CLIENT_ID,
        "redirect_uri": settings.GOOGLE_REDIRECT_URI,
        "response_type": "code",
        "scope": "openid email profile",
        "state": state,
        "prompt": "select_account",
    })
    return RedirectResponse(f"https://accounts.google.com/o/oauth2/v2/auth?{query}")


@router.get("/google/callback")
async def google_callback(request: Request, code: Optional[str] = None, state: Optional[str] = None,
                          error: Optional[str] = None) -> Response:
    failure_url = f"{settings.FRONTEND_URL}/?auth_error=google"
    if error or not code or not state or not db.consume_oauth_state(state, "google"):
        return RedirectResponse(failure_url, status_code=status.HTTP_303_SEE_OTHER)
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            token_response = await client.post("https://oauth2.googleapis.com/token", data={
                "code": code, "client_id": settings.GOOGLE_CLIENT_ID,
                "client_secret": settings.GOOGLE_CLIENT_SECRET, "redirect_uri": settings.GOOGLE_REDIRECT_URI,
                "grant_type": "authorization_code",
            })
            token_response.raise_for_status()
            id_token = token_response.json().get("id_token")
            if not id_token:
                raise ValueError("Google response lacks an ID token")
            identity_response = await client.get("https://oauth2.googleapis.com/tokeninfo", params={"id_token": id_token})
            identity_response.raise_for_status()
            identity = identity_response.json()
        if identity.get("aud") != settings.GOOGLE_CLIENT_ID or identity.get("iss") not in {"accounts.google.com", "https://accounts.google.com"}:
            raise ValueError("Google ID token audience or issuer is invalid")
        if identity.get("email_verified") not in {True, "true"}:
            raise ValueError("Google account email is not verified")
        google_id, email = identity.get("sub"), normalize_email(identity.get("email", ""))
        if not google_id:
            raise ValueError("Google subject is unavailable")
        user = db.get_user_by_google_id(google_id)
        by_email = db.get_user_by_email(email)
        if user and by_email and user["id"] != by_email["id"]:
            raise ValueError("Google identity conflicts with an existing account")
        if not user and by_email:
            db.link_google_identity(by_email["id"], google_id, identity.get("picture"), True)
            user = db.get_user_by_id(by_email["id"])
        if not user:
            user = db.create_user(
                email=email, full_name=(identity.get("name") or email.split("@", 1)[0])[:160],
                password_hash=None, password_salt=None, google_id=google_id,
                avatar_url=identity.get("picture"), email_verified=True,
            )
        response = RedirectResponse(settings.FRONTEND_URL, status_code=status.HTTP_303_SEE_OTHER)
        db.update_last_login(user["id"])
        token = db.create_session(user["id"], request.headers.get("user-agent"), request.client.host if request.client else None,
                                  settings.SESSION_TTL_HOURS)
        set_session_cookie(response, token)
        return response
    except Exception as exc:
        logger.warning("Google OAuth callback failed: %s", exc.__class__.__name__)
        return RedirectResponse(failure_url, status_code=status.HTTP_303_SEE_OTHER)
