"""Deals read-side endpoint: discount math, honesty rule, scope, best-pick."""
import uuid
import pytest
from datetime import datetime, timezone, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from httpx import AsyncClient

from app.modules.promotion.models import (
    Promotion, PromotionTranslation, PromotionProductTarget,
    PromotionCategoryTarget, PromotionPaymentMethodTarget,
)

pytestmark = pytest.mark.asyncio

# Seeded product prod1 has base_price_vnd = 12,000,000 in category cat1.
BASE = 12000000


def _uid():
    return str(uuid.uuid4())


def _now():
    return datetime.now(timezone.utc)


def _add_promo(db, *, scope="PRODUCT", discount_type="PERCENTAGE", bps=None,
               amount=None, max_vnd=None, trigger="AUTOMATIC", status="ACTIVE",
               min_order=None, starts_delta=-1, ends_delta=None, badge="SALE"):
    pid = _uid()
    promo = Promotion(
        id=pid, trigger=trigger, scope_type=scope, status=status,
        discount_type=discount_type, discount_percentage_bps=bps,
        discount_amount_vnd=amount, max_discount_vnd=max_vnd,
        min_order_value_vnd=min_order, priority=100,
        starts_at=_now() + timedelta(days=starts_delta),
        ends_at=(_now() + timedelta(days=ends_delta)) if ends_delta is not None else None,
    )
    db.add(promo)
    db.add(PromotionTranslation(id=_uid(), promotion_id=pid, locale="vi",
                                name="Ưu đãi", badge_label=badge,
                                created_at=_now(), updated_at=_now()))
    return promo


async def _deals(client: AsyncClient):
    res = await client.get("/api/v1/products/deals?locale=vi")
    assert res.status_code == 200
    return res.json()["items"]


async def test_percentage_deal_no_cap(client, seeded_db, db_session):
    p = _add_promo(db_session, bps=2000)  # 20%
    db_session.add(PromotionProductTarget(promotion_id=p.id, product_id="prod1"))
    await db_session.commit()

    deal = next(i for i in await _deals(client) if i["id"] == "prod1")
    assert deal["originalPriceVnd"] == BASE
    assert deal["dealPriceVnd"] == 9600000  # 12M * 0.8
    assert deal["discountPct"] == 20
    assert deal["badgeLabel"] == "SALE"


async def test_percentage_deal_with_cap(client, seeded_db, db_session):
    p = _add_promo(db_session, bps=5000, max_vnd=1000000)  # 50% capped at 1M
    db_session.add(PromotionProductTarget(promotion_id=p.id, product_id="prod1"))
    await db_session.commit()

    deal = next(i for i in await _deals(client) if i["id"] == "prod1")
    assert deal["dealPriceVnd"] == 11000000  # 12M - capped 1M


async def test_fixed_deal_clamped_to_base(client, seeded_db, db_session):
    p = _add_promo(db_session, discount_type="FIXED_AMOUNT", amount=99999999)
    db_session.add(PromotionProductTarget(promotion_id=p.id, product_id="prod1"))
    await db_session.commit()

    deal = next(i for i in await _deals(client) if i["id"] == "prod1")
    assert deal["dealPriceVnd"] == 0  # discount can't exceed base price


async def test_category_scope_expands_to_products(client, seeded_db, db_session):
    p = _add_promo(db_session, scope="CATEGORY", bps=1000)  # 10%
    db_session.add(PromotionCategoryTarget(promotion_id=p.id, room_category_id="cat1"))
    await db_session.commit()

    assert any(i["id"] == "prod1" for i in await _deals(client))


async def test_min_order_promo_excluded(client, seeded_db, db_session):
    p = _add_promo(db_session, bps=2000, min_order=5000000)
    db_session.add(PromotionProductTarget(promotion_id=p.id, product_id="prod1"))
    await db_session.commit()

    assert all(i["id"] != "prod1" for i in await _deals(client))


async def test_payment_method_restricted_excluded(client, seeded_db, db_session):
    p = _add_promo(db_session, bps=2000)
    db_session.add(PromotionProductTarget(promotion_id=p.id, product_id="prod1"))
    db_session.add(PromotionPaymentMethodTarget(promotion_id=p.id, payment_method="COD"))
    await db_session.commit()

    assert all(i["id"] != "prod1" for i in await _deals(client))


async def test_coupon_paused_and_expired_excluded(client, seeded_db, db_session):
    coupon = _add_promo(db_session, bps=3000, trigger="COUPON")
    db_session.add(PromotionProductTarget(promotion_id=coupon.id, product_id="prod1"))
    paused = _add_promo(db_session, bps=3000, status="PAUSED")
    db_session.add(PromotionProductTarget(promotion_id=paused.id, product_id="prod1"))
    expired = _add_promo(db_session, bps=3000, ends_delta=-1)  # ended yesterday
    db_session.add(PromotionProductTarget(promotion_id=expired.id, product_id="prod1"))
    await db_session.commit()

    assert all(i["id"] != "prod1" for i in await _deals(client))


async def test_best_discount_wins_for_product(client, seeded_db, db_session):
    p10 = _add_promo(db_session, bps=1000, badge="TEN")
    db_session.add(PromotionProductTarget(promotion_id=p10.id, product_id="prod1"))
    p30 = _add_promo(db_session, bps=3000, badge="THIRTY")
    db_session.add(PromotionProductTarget(promotion_id=p30.id, product_id="prod1"))
    await db_session.commit()

    deal = next(i for i in await _deals(client) if i["id"] == "prod1")
    assert deal["discountPct"] == 30
    assert deal["badgeLabel"] == "THIRTY"


async def test_no_deals_returns_empty(client, seeded_db):
    assert await _deals(client) == []
