from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.modules.promotion.models import PromotionRedemption
from app.shared.enums import PromotionRedemptionStatus


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
