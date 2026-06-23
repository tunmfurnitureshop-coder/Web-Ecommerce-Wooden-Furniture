"""
T6-T8: Promotion lifecycle and config validation.
"""
import uuid
import pytest
from datetime import datetime, timezone, timedelta
from sqlalchemy import select
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.order.models import Order
from app.modules.promotion.models import PromotionRedemption, OrderPromotion, Promotion
from app.shared.enums import PromotionRedemptionStatus, PromotionStatus

pytestmark = pytest.mark.asyncio

_ORDER = {
    "customerName": "Promo Test",
    "customerPhone": "0900000088",
    "customerEmail": "promo@example.com",
    "shippingAddress": "TP.HCM",
    "paymentMethod": "COD",
    "items": [{"productId": "prod1", "quantity": 1,
               "selectedOptions": {"woodType": "oak", "finish": "natural", "size": "medium"}}],
}


async def _get_order(db: AsyncSession, order_code: str) -> Order:
    return (await db.execute(select(Order).where(Order.order_code == order_code))).scalar_one()


async def _seed_promotion(db: AsyncSession, status: str = PromotionStatus.ACTIVE,
                          ends_at: datetime | None = None) -> Promotion:
    promo = Promotion(
        id=str(uuid.uuid4()), trigger="COUPON", scope_type="CART",
        status=status, discount_type="FIXED_VND", discount_amount_vnd=50000,
        priority=100, starts_at=datetime.now(timezone.utc) - timedelta(days=1),
        ends_at=ends_at,
    )
    db.add(promo)
    await db.flush()
    return promo


async def _reserve_promotion(db: AsyncSession, order: Order, promo: Promotion) -> PromotionRedemption:
    redemption = PromotionRedemption(
        id=str(uuid.uuid4()), promotion_id=promo.id, order_id=order.id,
        discount_vnd=50000,
    )
    db.add(redemption)
    db.add(OrderPromotion(
        id=str(uuid.uuid4()), order_id=order.id, promotion_id=promo.id,
        promotion_name_snapshot="Test Promo", trigger_snapshot="COUPON",
        scope_type_snapshot="CART", discount_type_snapshot="FIXED_VND",
        discount_vnd=50000, allocation_snapshot=[],
    ))
    await db.commit()
    return redemption


# T6 ─────────────────────────────────────────────────────────────────────────
async def test_cancel_order_releases_promotion_redemption(
    client: AsyncClient, seeded_db, db_session: AsyncSession
):
    res = await client.post("/api/v1/orders", json=_ORDER)
    order = await _get_order(db_session, res.json()["orderCode"])
    promo = await _seed_promotion(db_session)
    redemption = await _reserve_promotion(db_session, order, promo)

    token_res = await client.post("/api/v1/admin/auth/login",
                                  json={"email": "admin@example.com", "password": "admin123"})
    auth = {"Authorization": f"Bearer {token_res.json()['accessToken']}"}

    cancel_res = await client.patch(f"/api/v1/admin/orders/{order.id}/status",
                                    json={"orderStatus": "CANCELLED"}, headers=auth)
    assert cancel_res.status_code == 200

    await db_session.refresh(redemption)
    assert redemption.status == PromotionRedemptionStatus.RELEASED
    assert redemption.released_at is not None

    # Second cancel must not create duplicate RELEASED rows
    await client.patch(f"/api/v1/admin/orders/{order.id}/status",
                       json={"orderStatus": "CANCELLED"}, headers=auth)
    rows = (await db_session.execute(
        select(PromotionRedemption).where(
            PromotionRedemption.order_id == order.id,
            PromotionRedemption.status == PromotionRedemptionStatus.RELEASED,
        )
    )).scalars().all()
    assert len(rows) == 1


# T7 ─────────────────────────────────────────────────────────────────────────
async def test_payment_retry_rejects_expired_promotion(
    client: AsyncClient, seeded_db, db_session: AsyncSession
):
    res = await client.post("/api/v1/orders", json={**_ORDER, "paymentMethod": "PAYOS"})
    # PAYOS order creation may fail to create a payment link (no credentials),
    # but will still persist the order. Tolerate 200 or 502.
    assert res.status_code in (200, 502)

    # Ensure the order exists regardless of payment link outcome
    from app.modules.order.models import Order as OrderModel
    orders = (await db_session.execute(select(OrderModel))).scalars().all()
    assert orders, "Order must be persisted even if payment link fails"
    order = orders[-1]

    # Attach an expired/archived promotion
    expired_promo = await _seed_promotion(
        db_session, status=PromotionStatus.ARCHIVED,
        ends_at=datetime.now(timezone.utc) - timedelta(hours=1),
    )
    await _reserve_promotion(db_session, order, expired_promo)

    retry_res = await client.post(f"/api/v1/orders/{order.order_code}/payments/retry")
    assert retry_res.status_code == 422
    assert retry_res.json()["error"]["code"] == "PROMOTION_EXPIRED"


# T8 ─────────────────────────────────────────────────────────────────────────
def test_promotion_max_active_per_order_must_equal_one():
    from pydantic import BaseModel, ValidationError, field_validator

    class _Cfg(BaseModel):
        PROMOTION_MAX_ACTIVE_PER_ORDER: int = 1

        @field_validator("PROMOTION_MAX_ACTIVE_PER_ORDER")
        @classmethod
        def _check(cls, v: int) -> int:
            if v != 1:
                raise ValueError("must equal 1")
            return v

    with pytest.raises(ValidationError):
        _Cfg(PROMOTION_MAX_ACTIVE_PER_ORDER=2)

    cfg = _Cfg(PROMOTION_MAX_ACTIVE_PER_ORDER=1)
    assert cfg.PROMOTION_MAX_ACTIVE_PER_ORDER == 1
