import pytest
from httpx import AsyncClient
from tests.helpers import admin_login

pytestmark = pytest.mark.asyncio

CREATE_CONTENT = {
    "type": "BUYING_GUIDE",
    "status": "DRAFT",
    "author_name": "Vin Furniture",
    "translations": {
        "vi": {
            "title": "Hướng dẫn chọn bàn ăn",
            "slug": "huong-dan-chon-ban-an",
            "excerpt": "Bài viết hướng dẫn",
            "body_markdown": "## Giới thiệu\nNội dung bài viết chi tiết.",
        }
    },
}

PUBLISHED_CONTENT = {
    **CREATE_CONTENT,
    "status": "PUBLISHED",
    "cover_image_url": "https://example.com/cover.jpg",
}


async def test_create_draft_content(client: AsyncClient, seeded_db):
    auth = await admin_login(client)
    res = await client.post("/api/v1/admin/content", json=CREATE_CONTENT, headers=auth)
    assert res.status_code == 201, res.text
    data = res.json()
    assert data["type"] == "BUYING_GUIDE"
    assert data["status"] == "DRAFT"


async def test_draft_content_hidden_publicly(client: AsyncClient, seeded_db):
    auth = await admin_login(client)
    await client.post("/api/v1/admin/content", json=CREATE_CONTENT, headers=auth)
    res = await client.get("/api/v1/guides?locale=vi")
    assert res.status_code == 200
    items = res.json().get("items", [])
    slugs = [g.get("slug") for g in items]
    assert "huong-dan-chon-ban-an" not in slugs


async def test_publish_content(client: AsyncClient, seeded_db):
    auth = await admin_login(client)
    res = await client.post("/api/v1/admin/content", json=CREATE_CONTENT, headers=auth)
    assert res.status_code == 201, res.text
    content_id = res.json()["id"]
    pub = await client.patch(
        f"/api/v1/admin/content/{content_id}",
        json={"status": "PUBLISHED", "cover_image_url": "https://example.com/cover.jpg"},
        headers=auth,
    )
    assert pub.status_code == 200, pub.text
    assert pub.json()["status"] == "PUBLISHED"
    pub_res = await client.get("/api/v1/guides?locale=vi")
    items = pub_res.json().get("items", [])
    slugs = [g.get("slug") for g in items]
    assert "huong-dan-chon-ban-an" in slugs


async def test_archived_content_hidden_publicly(client: AsyncClient, seeded_db):
    auth = await admin_login(client)
    res = await client.post("/api/v1/admin/content", json=PUBLISHED_CONTENT, headers=auth)
    assert res.status_code == 201, res.text
    content_id = res.json()["id"]
    await client.patch(f"/api/v1/admin/content/{content_id}", json={"status": "ARCHIVED"}, headers=auth)
    pub_res = await client.get("/api/v1/guides?locale=vi")
    items = pub_res.json().get("items", [])
    slugs = [g.get("slug") for g in items]
    assert "huong-dan-chon-ban-an" not in slugs


async def test_content_product_linking(client: AsyncClient, seeded_db):
    auth = await admin_login(client)
    res = await client.post("/api/v1/admin/content", json=CREATE_CONTENT, headers=auth)
    assert res.status_code == 201, res.text
    content_id = res.json()["id"]
    add = await client.post(
        f"/api/v1/admin/content/{content_id}/products",
        json={"product_id": "prod1", "sort_order": 0},
        headers=auth,
    )
    assert add.status_code in (200, 201, 204), add.text


async def test_markdown_sanitization_strips_script(client: AsyncClient, seeded_db):
    from app.modules.content.markdown import render_markdown
    html = render_markdown("Normal text <script>alert('xss')</script> more text")
    assert "<script>" not in html
    assert "</script>" not in html


async def test_localized_slug_uniqueness(client: AsyncClient, seeded_db):
    auth = await admin_login(client)
    await client.post("/api/v1/admin/content", json=CREATE_CONTENT, headers=auth)
    body2 = {
        **CREATE_CONTENT,
        "translations": {
            "vi": {
                **CREATE_CONTENT["translations"]["vi"],
                "title": "Another Article",
                "slug": "huong-dan-chon-ban-an",  # same slug
            }
        },
    }
    res2 = await client.post("/api/v1/admin/content", json=body2, headers=auth)
    assert res2.status_code in (400, 409, 422)
