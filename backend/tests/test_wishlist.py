import pytest
from httpx import AsyncClient
from helpers import customer_login

pytestmark = pytest.mark.asyncio


async def test_add_product_to_wishlist(client: AsyncClient, seeded_db):
    token = await customer_login(client, "a@example.com", "PasswordA1")
    headers = {"Authorization": f"Bearer {token}"}

    res = await client.post("/api/v1/customer/wishlist/items", json={"productId": "prod1"}, headers=headers)
    assert res.status_code == 200  # POST /wishlist/items returns 200 (idempotent upsert)

    list_res = await client.get("/api/v1/customer/wishlist", headers=headers)
    assert list_res.status_code == 200
    assert len(list_res.json()["items"]) == 1
    assert list_res.json()["items"][0]["productId"] == "prod1"


async def test_duplicate_add_is_idempotent(client: AsyncClient, seeded_db):
    token = await customer_login(client, "a@example.com", "PasswordA1")
    headers = {"Authorization": f"Bearer {token}"}

    await client.post("/api/v1/customer/wishlist/items", json={"productId": "prod1"}, headers=headers)
    res = await client.post("/api/v1/customer/wishlist/items", json={"productId": "prod1"}, headers=headers)
    assert res.status_code in (200, 201)  # idempotent — no error

    list_res = await client.get("/api/v1/customer/wishlist", headers=headers)
    assert len(list_res.json()["items"]) == 1  # still only one entry


async def test_remove_wishlist_item(client: AsyncClient, seeded_db):
    token = await customer_login(client, "a@example.com", "PasswordA1")
    headers = {"Authorization": f"Bearer {token}"}

    await client.post("/api/v1/customer/wishlist/items", json={"productId": "prod1"}, headers=headers)
    del_res = await client.delete("/api/v1/customer/wishlist/items/prod1", headers=headers)
    assert del_res.status_code == 204

    list_res = await client.get("/api/v1/customer/wishlist", headers=headers)
    assert len(list_res.json()["items"]) == 0


async def test_customer_cannot_access_another_wishlist(client: AsyncClient, seeded_db):
    token_a = await customer_login(client, "a@example.com", "PasswordA1")
    token_b = await customer_login(client, "b@example.com", "PasswordB1")

    await client.post(
        "/api/v1/customer/wishlist/items", json={"productId": "prod1"},
        headers={"Authorization": f"Bearer {token_a}"},
    )

    # Customer B's wishlist should be empty (doesn't see A's items)
    list_res = await client.get("/api/v1/customer/wishlist", headers={"Authorization": f"Bearer {token_b}"})
    assert list_res.status_code == 200
    assert len(list_res.json()["items"]) == 0
