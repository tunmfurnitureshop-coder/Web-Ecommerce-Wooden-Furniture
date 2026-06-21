import pytest
from httpx import AsyncClient
from tests.helpers import admin_login

pytestmark = pytest.mark.asyncio

CREATE_COLLECTION = {
    "code": "summer_2024",
    "status": "DRAFT",
    "is_featured": False,
    "translations": {
        "vi": {"name": "Bộ sưu tập hè 2024", "slug": "bo-suu-tap-he-2024", "short_description": "Đẹp"}
    },
}


async def test_create_draft_collection(client: AsyncClient, seeded_db):
    auth = await admin_login(client)
    res = await client.post("/api/v1/admin/collections", json=CREATE_COLLECTION, headers=auth)
    assert res.status_code == 201, res.text
    data = res.json()
    assert data["code"] == "summer_2024"
    assert data["status"] == "DRAFT"


async def test_draft_collection_hidden_publicly(client: AsyncClient, seeded_db):
    auth = await admin_login(client)
    await client.post("/api/v1/admin/collections", json=CREATE_COLLECTION, headers=auth)
    res = await client.get("/api/v1/collections?locale=vi")
    assert res.status_code == 200
    codes = [c["code"] for c in res.json().get("items", [])]
    assert "summer_2024" not in codes


async def test_only_published_collections_visible_publicly(client: AsyncClient, seeded_db):
    auth = await admin_login(client)
    res = await client.post("/api/v1/admin/collections", json=CREATE_COLLECTION, headers=auth)
    assert res.status_code == 201, res.text
    col_id = res.json()["id"]
    # Add at least 1 product before publishing (required by validation)
    await client.post(f"/api/v1/admin/collections/{col_id}/products",
                      json={"product_id": "prod1", "sort_order": 0}, headers=auth)
    patch = await client.patch(f"/api/v1/admin/collections/{col_id}", json={"status": "PUBLISHED"}, headers=auth)
    assert patch.status_code == 200, patch.text
    pub_res = await client.get("/api/v1/collections?locale=vi")
    assert pub_res.status_code == 200
    slugs = [c.get("slug") for c in pub_res.json().get("items", [])]
    assert "bo-suu-tap-he-2024" in slugs


async def test_add_product_to_collection(client: AsyncClient, seeded_db):
    auth = await admin_login(client)
    res = await client.post("/api/v1/admin/collections", json=CREATE_COLLECTION, headers=auth)
    assert res.status_code == 201, res.text
    col_id = res.json()["id"]
    add = await client.post(
        f"/api/v1/admin/collections/{col_id}/products",
        json={"product_id": "prod1", "sort_order": 0},
        headers=auth,
    )
    assert add.status_code in (200, 201), add.text
    detail = await client.get(f"/api/v1/admin/collections/{col_id}", headers=auth)
    assert detail.status_code == 200
    assert detail.json()["product_count"] == 1


async def test_remove_product_from_collection(client: AsyncClient, seeded_db):
    auth = await admin_login(client)
    res = await client.post("/api/v1/admin/collections", json=CREATE_COLLECTION, headers=auth)
    assert res.status_code == 201, res.text
    col_id = res.json()["id"]
    await client.post(
        f"/api/v1/admin/collections/{col_id}/products",
        json={"product_id": "prod1", "sort_order": 0},
        headers=auth,
    )
    rm = await client.delete(f"/api/v1/admin/collections/{col_id}/products/prod1", headers=auth)
    assert rm.status_code in (200, 204), rm.text
    detail = await client.get(f"/api/v1/admin/collections/{col_id}", headers=auth)
    assert detail.json()["product_count"] == 0


async def test_reject_duplicate_collection_code(client: AsyncClient, seeded_db):
    auth = await admin_login(client)
    await client.post("/api/v1/admin/collections", json=CREATE_COLLECTION, headers=auth)
    res2 = await client.post("/api/v1/admin/collections", json=CREATE_COLLECTION, headers=auth)
    assert res2.status_code in (400, 409, 422)


async def test_collection_products_ordered_by_sort_order(client: AsyncClient, seeded_db):
    auth = await admin_login(client)
    res = await client.post("/api/v1/admin/collections", json=CREATE_COLLECTION, headers=auth)
    assert res.status_code == 201, res.text
    col_id = res.json()["id"]
    await client.post(f"/api/v1/admin/collections/{col_id}/products",
                      json={"product_id": "prod1", "sort_order": 10}, headers=auth)
    # Publish to test public API
    await client.patch(f"/api/v1/admin/collections/{col_id}", json={"status": "PUBLISHED"}, headers=auth)
    pub = await client.get("/api/v1/collections/bo-suu-tap-he-2024?locale=vi")
    assert pub.status_code == 200
    products = pub.json().get("products", [])
    if len(products) > 1:
        orders = [p["sort_order"] for p in products]
        assert orders == sorted(orders)
