"""Generic admin image upload endpoint: validation, auth, happy path (storage mocked)."""
import pytest
from httpx import AsyncClient

from tests.helpers import admin_login

pytestmark = pytest.mark.asyncio

_PNG = b"\x89PNG\r\n\x1a\n" + b"0" * 64


class _FakeStorage:
    async def upload(self, key, data, content_type):
        return f"https://fake.r2.dev/{key}"

    async def delete(self, key):
        return None


async def test_upload_image_returns_url(client: AsyncClient, seeded_db, monkeypatch):
    monkeypatch.setattr("app.modules.media.service._get_storage", lambda: _FakeStorage())
    auth = await admin_login(client)

    res = await client.post(
        "/api/v1/admin/uploads/image",
        files={"file": ("hero.png", _PNG, "image/png")},
        data={"prefix": "campaigns"},
        headers=auth,
    )
    assert res.status_code == 200, res.text
    body = res.json()
    assert body["url"] == f"https://fake.r2.dev/{body['key']}"
    assert body["key"].startswith("campaigns/")
    assert body["key"].endswith(".png")


async def test_upload_rejects_non_image(client: AsyncClient, seeded_db):
    auth = await admin_login(client)
    res = await client.post(
        "/api/v1/admin/uploads/image",
        files={"file": ("note.txt", b"hello", "text/plain")},
        headers=auth,
    )
    assert res.status_code == 422


async def test_upload_requires_admin(client: AsyncClient, seeded_db):
    res = await client.post(
        "/api/v1/admin/uploads/image",
        files={"file": ("hero.png", _PNG, "image/png")},
    )
    assert res.status_code in (401, 403)
