from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.modules.promotion.models import Promotion, PromotionRedemption
from app.shared.enums import PromotionRedemptionStatus, PromotionStatus


async def redeem_for_order(db: AsyncSession, order_id: str) -> None:
    redemption = (await db.execute(
        select(PromotionRedemption).where(
            PromotionRedemption.order_id == order_id,
            PromotionRedemption.status == PromotionRedemptionStatus.RESERVED,
        )
    )).scalar_one_or_none()
    if redemption:
        redemption.status = PromotionRedemptionStatus.REDEEMED
        redemption.redeemed_at = datetime.now(timezone.utc)


async def release_for_order(db: AsyncSession, order_id: str) -> None:
    redemption = (await db.execute(
        select(PromotionRedemption).where(
            PromotionRedemption.order_id == order_id,
            PromotionRedemption.status == PromotionRedemptionStatus.RESERVED,
        )
    )).scalar_one_or_none()
    if redemption:
        redemption.status = PromotionRedemptionStatus.RELEASED
        redemption.released_at = datetime.now(timezone.utc)


async def is_promotion_still_valid(db: AsyncSession, promotion_id: str) -> bool:
    """Return True only if promotion is ACTIVE and not past its end date."""
    promo = (await db.execute(
        select(Promotion).where(Promotion.id == promotion_id)
    )).scalar_one_or_none()
    if not promo:
        return False
    if promo.status != PromotionStatus.ACTIVE:
        return False
    now = datetime.now(timezone.utc)
    if promo.ends_at is not None:
        ends = promo.ends_at if promo.ends_at.tzinfo else promo.ends_at.replace(tzinfo=timezone.utc)
        if ends <= now:
            return False
    return True
