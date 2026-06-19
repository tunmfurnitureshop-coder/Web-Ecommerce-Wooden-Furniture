import pytest
from httpx import AsyncClient

pytestmark = pytest.mark.asyncio


async def test_admin_login_success(client: AsyncClient, seeded_db):
    res = await client.post("/api/v1/admin/auth/login", json={"email": "admin@example.com", "password": "admin123"})
    assert res.status_code == 200
    data = res.json()
    assert "accessToken" in data
    assert data["tokenType"] == "bearer"


async def test_admin_login_wrong_password(client: AsyncClient, seeded_db):
    res = await client.post("/api/v1/admin/auth/login", json={"email": "admin@example.com", "password": "wrong"})
    assert res.status_code == 401


async def test_protected_route_without_token(client: AsyncClient, seeded_db):
    res = await client.get("/api/v1/admin/products")
    assert res.status_code == 403


async def test_protected_route_with_token(client: AsyncClient, seeded_db):
    token_res = await client.post("/api/v1/admin/auth/login", json={"email": "admin@example.com", "password": "admin123"})
    token = token_res.json()["accessToken"]
    res = await client.get("/api/v1/admin/products", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
