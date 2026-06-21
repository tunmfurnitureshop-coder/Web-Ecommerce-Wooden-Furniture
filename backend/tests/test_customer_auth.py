import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from helpers import customer_login

pytestmark = pytest.mark.asyncio

REGISTER_BODY = {"email": "new@example.com", "password": "SecurePass1", "fullName": "Test User"}


async def test_register_valid_input(client: AsyncClient, seeded_db):
    res = await client.post("/api/v1/customer/auth/register", json=REGISTER_BODY)
    assert res.status_code == 201
    data = res.json()
    assert data["customer"]["email"] == "new@example.com"


async def test_register_duplicate_email_returns_409(client: AsyncClient, seeded_db):
    await client.post("/api/v1/customer/auth/register", json=REGISTER_BODY)
    res = await client.post("/api/v1/customer/auth/register", json=REGISTER_BODY)
    assert res.status_code == 409
    assert res.json()["error"]["code"] == "EMAIL_TAKEN"


async def test_register_weak_password_returns_422(client: AsyncClient, seeded_db):
    body = {**REGISTER_BODY, "password": "weak"}
    res = await client.post("/api/v1/customer/auth/register", json=body)
    assert res.status_code == 422


async def test_login_success_returns_token(client: AsyncClient, seeded_db):
    res = await client.post("/api/v1/customer/auth/login", json={"email": "a@example.com", "password": "PasswordA1"})
    assert res.status_code == 200
    data = res.json()
    assert "accessToken" in data
    assert data["customer"]["email"] == "a@example.com"


async def test_login_wrong_password_returns_401(client: AsyncClient, seeded_db):
    res = await client.post("/api/v1/customer/auth/login", json={"email": "a@example.com", "password": "wrong"})
    assert res.status_code == 401


async def test_login_blocked_customer_returns_403(client: AsyncClient, seeded_db):
    res = await client.post("/api/v1/customer/auth/login", json={"email": "blocked@example.com", "password": "PasswordC1"})
    assert res.status_code == 403
    assert res.json()["error"]["code"] == "CUSTOMER_BLOCKED"


async def test_refresh_token_success(client: AsyncClient, seeded_db):
    await client.post("/api/v1/customer/auth/login", json={"email": "a@example.com", "password": "PasswordA1"})
    res = await client.post("/api/v1/customer/auth/refresh")
    assert res.status_code == 200
    assert "accessToken" in res.json()


async def test_refresh_token_without_cookie_returns_401(client: AsyncClient, seeded_db):
    res = await client.post("/api/v1/customer/auth/refresh")
    assert res.status_code == 401


async def test_logout_revokes_refresh_token(client: AsyncClient, seeded_db):
    token = await customer_login(client, "a@example.com", "PasswordA1")
    await client.post("/api/v1/customer/auth/logout", headers={"Authorization": f"Bearer {token}"})
    res = await client.post("/api/v1/customer/auth/refresh")
    assert res.status_code == 401


async def test_email_verification_token_expiry_returns_400(client: AsyncClient, db_session: AsyncSession, seeded_db):
    from datetime import timedelta, timezone as tz
    from datetime import datetime
    from app.modules.customer_auth.models import CustomerAuthToken
    import hashlib, secrets
    raw = secrets.token_urlsafe(32)
    token_hash = hashlib.sha256(raw.encode()).hexdigest()
    expired_token = CustomerAuthToken(
        customer_id="cust_a",
        token_type="EMAIL_VERIFICATION",
        token_hash=token_hash,
        expires_at=datetime.now(tz.utc) - timedelta(hours=1),
    )
    db_session.add(expired_token)
    await db_session.commit()
    res = await client.post("/api/v1/customer/auth/verify-email", json={"token": raw})
    assert res.status_code == 400


async def test_forgot_password_nonexistent_email_returns_200(client: AsyncClient, seeded_db):
    res = await client.post("/api/v1/customer/auth/forgot-password", json={"email": "nobody@nowhere.com"})
    assert res.status_code == 200
    # Same message regardless of whether email exists
    assert "instructions" in res.json()["message"].lower() or "sent" in res.json()["message"].lower()


async def test_reset_password_revokes_all_sessions(client: AsyncClient, db_session: AsyncSession, seeded_db):
    from app.modules.customer_auth import service
    from app.shared.enums import CustomerTokenType

    token_a = await customer_login(client, "a@example.com", "PasswordA1")

    raw_reset = await service.create_one_time_token(db_session, "cust_a", CustomerTokenType.PASSWORD_RESET, 1)
    await db_session.commit()

    res = await client.post("/api/v1/customer/auth/reset-password", json={"token": raw_reset, "newPassword": "NewPassword2"})
    assert res.status_code == 200

    # Existing session cookie should no longer work
    refresh_res = await client.post("/api/v1/customer/auth/refresh")
    assert refresh_res.status_code == 401
