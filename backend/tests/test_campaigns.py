"""Admin campaign patch: dates can be set and cleared (exclude_unset semantics)."""
import pytest
from httpx import AsyncClient

from tests.helpers import admin_login

pytestmark = pytest.mark.asyncio


async def _create(client, auth, **overrides):
    body = {
        "code": "PATCHTEST", "status": "ACTIVE", "placement": "HOME_HERO",
        "startsAt": "2026-06-01T00:00:00Z", "endsAt": "2026-12-31T00:00:00Z",
        "translations": [{"locale": "vi", "name": "X", "slug": "x-camp"}],
        **overrides,
    }
    res = await client.post("/api/v1/admin/campaigns", json=body, headers=auth)
    assert res.status_code == 200, res.text
    return res.json()["id"]


async def test_patch_clears_end_date(client: AsyncClient, seeded_db):
    auth = await admin_login(client)
    cid = await _create(client, auth)

    r = await client.patch(f"/api/v1/admin/campaigns/{cid}", json={"endsAt": None}, headers=auth)
    assert r.status_code == 200
    got = (await client.get(f"/api/v1/admin/campaigns/{cid}", headers=auth)).json()
    assert got["endsAt"] is None


async def test_patch_updates_end_date(client: AsyncClient, seeded_db):
    auth = await admin_login(client)
    cid = await _create(client, auth)

    r = await client.patch(
        f"/api/v1/admin/campaigns/{cid}",
        json={"endsAt": "2027-01-01T00:00:00Z"}, headers=auth,
    )
    assert r.status_code == 200
    got = (await client.get(f"/api/v1/admin/campaigns/{cid}", headers=auth)).json()
    assert got["endsAt"] is not None
    assert got["endsAt"].startswith("2027-01-01")


async def test_patch_status_only_keeps_other_fields(client: AsyncClient, seeded_db):
    auth = await admin_login(client)
    cid = await _create(client, auth)

    r = await client.patch(f"/api/v1/admin/campaigns/{cid}", json={"status": "PAUSED"}, headers=auth)
    assert r.status_code == 200
    got = (await client.get(f"/api/v1/admin/campaigns/{cid}", headers=auth)).json()
    assert got["status"] == "PAUSED"
    assert got["placement"] == "HOME_HERO"  # untouched
    assert got["endsAt"] is not None  # untouched
