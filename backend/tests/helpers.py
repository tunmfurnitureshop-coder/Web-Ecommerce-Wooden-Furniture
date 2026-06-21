from httpx import AsyncClient


async def customer_login(client: AsyncClient, email: str, password: str) -> str:
    """Returns the raw access token after logging in."""
    res = await client.post("/api/v1/customer/auth/login", json={"email": email, "password": password})
    assert res.status_code == 200, res.text
    return res.json()["accessToken"]


async def admin_login(client: AsyncClient) -> dict:
    """Returns Authorization header dict for admin."""
    res = await client.post("/api/v1/admin/auth/login", json={"email": "admin@example.com", "password": "admin123"})
    assert res.status_code == 200
    return {"Authorization": f"Bearer {res.json()['accessToken']}"}
