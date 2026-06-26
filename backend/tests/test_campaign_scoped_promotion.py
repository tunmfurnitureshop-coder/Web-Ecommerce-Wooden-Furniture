"""Campaign target scoping: catalog filter (Phase 02) + promotion-link
validation (Phase 03)."""
import pytest
from datetime import datetime, timezone
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from tests.helpers import admin_login
from app.core.exceptions import AppException

pytestmark = pytest.mark.asyncio


def _dt(y, m, d):
    return datetime(y, m, d, tzinfo=timezone.utc)


async def _make_campaign(db: AsyncSession, *, target_type=None, target_id=None):
    from app.modules.campaign.models import Campaign, CampaignTranslation
    camp = Campaign(
        id="camp1", code="C1", status="ACTIVE", placement="HOME_HERO",
        target_type=target_type, target_id=target_id,
        starts_at=_dt(2026, 1, 1), ends_at=_dt(2030, 1, 1),
    )
    db.add(camp)
    db.add(CampaignTranslation(campaign_id="camp1", locale="vi", name="C", slug="c-slug"))
    await db.commit()
    return camp


def _promo(pid, trigger, scope):
    from app.modules.promotion.models import Promotion
    return Promotion(
        id=pid, trigger=trigger, scope_type=scope, status="ACTIVE",
        discount_type="PERCENTAGE", discount_percentage_bps=1000,
        starts_at=_dt(2026, 1, 1), ends_at=_dt(2030, 1, 1),
    )


async def test_catalog_scoped_by_campaign(client: AsyncClient, seeded_db, db_session):
    # campaign targets cat1 (the seeded dining_room category holding prod1)
    await _make_campaign(db_session, target_type="CATEGORY", target_id="cat1")

    res = await client.get("/api/v1/products?locale=vi&campaign=c-slug")
    assert res.status_code == 200, res.text
    body = res.json()
    assert body["total"] >= 1
    assert all(i["room"]["code"] == "dining_room" for i in body["items"])


async def test_unknown_campaign_slug_is_ignored(client: AsyncClient, seeded_db):
    res = await client.get("/api/v1/products?locale=vi&campaign=does-not-exist")
    assert res.status_code == 200
    assert res.json()["campaignBanner"] is None


async def test_link_requires_target(db_session: AsyncSession, seeded_db):
    from app.modules.campaign import service as csvc
    await _make_campaign(db_session)  # no target
    db_session.add(_promo("pa", "AUTOMATIC", "CATEGORY"))
    await db_session.commit()
    with pytest.raises(AppException) as e:
        await csvc.admin_add_campaign_promotion(db_session, "camp1", "pa")
    assert e.value.detail["code"] == "CAMPAIGN_TARGET_REQUIRED"


async def test_link_rejects_coupon_and_scope_mismatch(db_session: AsyncSession, seeded_db):
    from app.modules.campaign import service as csvc
    await _make_campaign(db_session, target_type="CATEGORY", target_id="cat1")
    db_session.add(_promo("pc", "COUPON", "CATEGORY"))
    db_session.add(_promo("pm", "AUTOMATIC", "CART"))  # automatic but wrong scope
    await db_session.commit()

    with pytest.raises(AppException) as e1:
        await csvc.admin_add_campaign_promotion(db_session, "camp1", "pc")
    assert e1.value.detail["code"] == "CAMPAIGN_PROMO_NOT_AUTOMATIC"

    with pytest.raises(AppException) as e2:
        await csvc.admin_add_campaign_promotion(db_session, "camp1", "pm")
    assert e2.value.detail["code"] == "CAMPAIGN_PROMO_SCOPE_MISMATCH"


async def test_link_accepts_automatic_matching_scope(db_session: AsyncSession, seeded_db):
    from app.modules.campaign import service as csvc
    from app.modules.promotion.models import PromotionCategoryTarget
    await _make_campaign(db_session, target_type="CATEGORY", target_id="cat1")
    db_session.add(_promo("pa", "AUTOMATIC", "CATEGORY"))
    db_session.add(PromotionCategoryTarget(promotion_id="pa", room_category_id="cat1"))
    await db_session.commit()

    res = await csvc.admin_add_campaign_promotion(db_session, "camp1", "pa")
    assert res["promotionId"] == "pa"
