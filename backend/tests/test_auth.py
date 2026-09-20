import uuid
import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.core.config import settings
from app.core.database import db
from app.core.security import hash_password, verify_password

@pytest.mark.asyncio
async def test_password_hashing():
    raw = "TopSecretPassword123!"
    hashed, salt = hash_password(raw)
    assert hashed != raw
    assert len(salt) > 10
    assert verify_password(raw, hashed, salt) is True
    assert verify_password("WrongPassword123!", hashed, salt) is False

@pytest.mark.asyncio
async def test_auth_config_endpoint():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.get("/api/v1/auth/config")
        assert res.status_code == 200
        data = res.json()
        assert "google_enabled" in data
        assert isinstance(data["google_enabled"], bool)

@pytest.mark.asyncio
async def test_login_invalid_credentials():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # Nonexistent email
        res = await ac.post("/api/v1/auth/login", json={
            "email": f"nonexistent_{uuid.uuid4().hex[:8]}@example.com",
            "password": "AnyPassword123!"
        })
        assert res.status_code == 401
        assert "Invalid email or password" in res.json()["detail"]

@pytest.mark.asyncio
async def test_register_and_login_flow():
    unique_suffix = uuid.uuid4().hex[:8]
    test_email = f"investigator_{unique_suffix}@agency.org"
    test_password = "SecureInvestigatorPassword2026!"
    test_name = "Sarah Connor"

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # 1. Register new user
        res = await ac.post("/api/v1/auth/register", json={
            "email": test_email,
            "password": test_password,
            "full_name": test_name,
            "organization": "Cyber Defense Agency"
        })
        assert res.status_code == 201
        data = res.json()
        assert data["user"]["email"] == test_email
        assert data["user"]["full_name"] == test_name
        assert settings.SESSION_COOKIE in res.cookies

        # 2. Verify database stored hashed password, NOT plain text
        user_in_db = db.get_user_by_email(test_email)
        assert user_in_db is not None
        assert user_in_db["password_hash"] != test_password
        assert verify_password(test_password, user_in_db["password_hash"], user_in_db["password_salt"]) is True

        # 3. Prevent duplicate registration
        res_dup = await ac.post("/api/v1/auth/register", json={
            "email": test_email,
            "password": test_password,
            "full_name": test_name
        })
        assert res_dup.status_code == 409

        # 4. Access protected /me route using session cookie
        res_me = await ac.get("/api/v1/auth/me", cookies=res.cookies)
        assert res_me.status_code == 200
        assert res_me.json()["email"] == test_email

        # 5. Logout and verify session revocation
        res_logout = await ac.post("/api/v1/auth/logout", cookies=res.cookies)
        assert res_logout.status_code == 204

        # 6. Access protected route after logout -> 401
        res_revoked = await ac.get("/api/v1/auth/me", cookies=res.cookies)
        assert res_revoked.status_code == 401

@pytest.mark.asyncio
async def test_forgot_and_reset_password():
    unique_suffix = uuid.uuid4().hex[:8]
    test_email = f"reset_user_{unique_suffix}@agency.org"
    initial_pw = "InitialSecretPassword2026!"
    new_pw = "BrandNewSecretPassword2026!"

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # Register user
        res_reg = await ac.post("/api/v1/auth/register", json={
            "email": test_email,
            "password": initial_pw,
            "full_name": "Reset Test User"
        })
        assert res_reg.status_code == 201

        # Request reset (returns generic message for privacy)
        res_forgot = await ac.post("/api/v1/auth/forgot-password", json={"email": test_email})
        assert res_forgot.status_code == 200
        assert "instructions have been sent" in res_forgot.json()["message"]

        # Directly generate reset token via db for testing reset flow
        reset_token = db.create_password_reset(test_email)
        assert reset_token is not None

        # Reset password with token
        res_reset = await ac.post("/api/v1/auth/reset-password", json={
            "token": reset_token,
            "new_password": new_pw
        })
        assert res_reset.status_code == 200

        # Login with new password
        res_new_login = await ac.post("/api/v1/auth/login", json={
            "email": test_email,
            "password": new_pw
        })
        assert res_new_login.status_code == 200

        # Old password no longer works
        res_old_login = await ac.post("/api/v1/auth/login", json={
            "email": test_email,
            "password": initial_pw
        })
        assert res_old_login.status_code == 401
