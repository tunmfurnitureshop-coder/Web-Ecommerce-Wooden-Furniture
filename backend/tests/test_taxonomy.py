import pytest
from httpx import AsyncClient
from tests.helpers import admin_login

pytestmark = pytest.mark.asyncio

CREATE_TAG = {
    "code": "walnut",
    "type": "MATERIAL",
    "sort_order": 1,
    "translations": {
        "vi": {"name": "Gỗ óc chó", "slug": "go-oc-cho"},
    },
}


async def test_create_tag_with_vi_translation(client: AsyncClient, seeded_db):
    auth = await admin_login(client)
    res = await client.post("/api/v1/admin/tags", json=CREATE_TAG, headers=auth)
    assert res.status_code == 201, res.text
    data = res.json()
    assert data["code"] == "walnut"
    assert data["type"] == "MATERIAL"
    assert any(t["locale"] == "vi" for t in data["translations"])


async def test_create_tag_with_vi_and_zhcn_translation(client: AsyncClient, seeded_db):
    auth = await admin_login(client)
    body = {**CREATE_TAG, "code": "bamboo", "translations": {
        "vi": {"name": "Tre", "slug": "tre"},
        "zh-CN": {"name": "竹子", "slug": "zhu-zi"},
    }}
    res = await client.post("/api/v1/admin/tags", json=body, headers=auth)
    assert res.status_code == 201, res.text
    assert len(res.json()["translations"]) == 2


async def test_reject_duplicate_tag_code(client: AsyncClient, seeded_db):
    auth = await admin_login(client)
    await client.post("/api/v1/admin/tags", json=CREATE_TAG, headers=auth)
    res2 = await client.post("/api/v1/admin/tags", json=CREATE_TAG, headers=auth)
    assert res2.status_code in (400, 409, 422)


async def test_reject_duplicate_locale_slug(client: AsyncClient, seeded_db):
    auth = await admin_login(client)
    await client.post("/api/v1/admin/tags", json=CREATE_TAG, headers=auth)
    body2 = {**CREATE_TAG, "code": "other_wood", "translations": {
        "vi": {"name": "Other", "slug": "go-oc-cho"}  # same slug
    }}
    res = await client.post("/api/v1/admin/tags", json=body2, headers=auth)
    assert res.status_code in (400, 409, 422)


async def test_deactivate_tag_success(client: AsyncClient, seeded_db):
    auth = await admin_login(client)
    res = await client.post("/api/v1/admin/tags", json=CREATE_TAG, headers=auth)
    assert res.status_code == 201, res.text
    tag_id = res.json()["id"]
    patch = await client.patch(f"/api/v1/admin/tags/{tag_id}", json={"is_active": False}, headers=auth)
    assert patch.status_code == 200
    assert patch.json()["is_active"] is False


async def test_list_tags_public_returns_active(client: AsyncClient, seeded_db):
    auth = await admin_login(client)
    await client.post("/api/v1/admin/tags", json=CREATE_TAG, headers=auth)
    res = await client.get("/api/v1/tags?locale=vi")
    assert res.status_code == 200
    assert "items" in res.json()


async def test_list_admin_tags(client: AsyncClient, seeded_db):
    auth = await admin_login(client)
    await client.post("/api/v1/admin/tags", json=CREATE_TAG, headers=auth)
    res = await client.get("/api/v1/admin/tags", headers=auth)
    assert res.status_code == 200
    assert len(res.json()["items"]) >= 1


async def test_filter_products_by_tag_returns_200(client: AsyncClient, seeded_db):
    auth = await admin_login(client)
    await client.post("/api/v1/admin/tags", json=CREATE_TAG, headers=auth)
    res = await client.get("/api/v1/products?locale=vi&tags=walnut")
    assert res.status_code == 200
    assert "items" in res.json()
