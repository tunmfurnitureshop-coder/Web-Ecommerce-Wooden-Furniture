from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.modules.promotion.models import (
    Promotion, PromotionRedemption,
)
from app.modules.collection.models import CollectionProduct
from app.shared.enums import PromotionStatus, PromotionScopeType, PromotionRedemptionStatus


@dataclass
class PricedItem:
    product_id: str
    quantity: int
    unit_price_vnd: int
    line_total_vnd: int
    room_category_id: str


_ACTIVE_STATUSES = [PromotionRedemptionStatus.RESERVED, PromotionRedemptionStatus.REDEEMED]


def check_date_range(promotion: Promotion) -> Optional[str]:
    now = datetime.now(timezone.utc)
    starts = promotion.starts_at
    if starts.tzinfo is None:
        starts = starts.replace(tzinfo=timezone.utc)
    if now < starts:
        return "NOT_STARTED"
    if promotion.ends_at:
        ends = promotion.ends_at
        if ends.tzinfo is None:
            ends = ends.replace(tzinfo=timezone.utc)
        if now > ends:
            return "EXPIRED"
    return None


def check_payment_method(promotion: Promotion, payment_method: str) -> Optional[str]:
    if not promotion.payment_method_targets:
        return None
    allowed = {t.payment_method for t in promotion.payment_method_targets}
    if payment_method not in allowed:
        return "PAYMENT_METHOD_NOT_ELIGIBLE"
    return None


def check_min_order(promotion: Promotion, eligible_subtotal: int) -> Optional[str]:
    if promotion.min_order_value_vnd and eligible_subtotal < promotion.min_order_value_vnd:
        return "MIN_ORDER_NOT_REACHED"
    return None


async def check_usage_limits(
    promotion: Promotion,
    customer_id: Optional[str],
    guest_email_hash: Optional[str],
    db: AsyncSession,
) -> Optional[str]:
    if promotion.usage_limit_total:
        result = await db.execute(
            select(func.count()).where(
                PromotionRedemption.promotion_id == promotion.id,
                PromotionRedemption.status.in_(_ACTIVE_STATUSES),
            )
        )
        if result.scalar_one() >= promotion.usage_limit_total:
            return "USAGE_LIMIT_REACHED"

    if promotion.usage_limit_per_customer:
        if customer_id:
            result = await db.execute(
                select(func.count()).where(
                    PromotionRedemption.promotion_id == promotion.id,
                    PromotionRedemption.customer_id == customer_id,
                    PromotionRedemption.status.in_(_ACTIVE_STATUSES),
                )
            )
            if result.scalar_one() >= promotion.usage_limit_per_customer:
                return "CUSTOMER_USAGE_LIMIT_REACHED"
        elif guest_email_hash:
            result = await db.execute(
                select(func.count()).where(
                    PromotionRedemption.promotion_id == promotion.id,
                    PromotionRedemption.guest_email_hash == guest_email_hash,
                    PromotionRedemption.status.in_(_ACTIVE_STATUSES),
                )
            )
            if result.scalar_one() >= promotion.usage_limit_per_customer:
                return "CUSTOMER_USAGE_LIMIT_REACHED"
    return None


async def get_eligible_items(
    promotion: Promotion,
    priced_items: list[PricedItem],
    db: AsyncSession,
) -> list[PricedItem]:
    scope = promotion.scope_type

    if scope == PromotionScopeType.CART:
        return priced_items

    if scope == PromotionScopeType.PRODUCT:
        target_ids = {t.product_id for t in promotion.product_targets}
        return [i for i in priced_items if i.product_id in target_ids]

    if scope == PromotionScopeType.CATEGORY:
        target_cat_ids = {t.room_category_id for t in promotion.category_targets}
        return [i for i in priced_items if i.room_category_id in target_cat_ids]

    if scope == PromotionScopeType.COLLECTION:
        collection_ids = {t.collection_id for t in promotion.collection_targets}
        if not collection_ids:
            return []
        result = await db.execute(
            select(CollectionProduct.product_id).where(
                CollectionProduct.collection_id.in_(collection_ids)
            )
        )
        in_collection = {row[0] for row in result.all()}
        return [i for i in priced_items if i.product_id in in_collection]

    if scope == PromotionScopeType.BUNDLE:
        item_qty = {i.product_id: i.quantity for i in priced_items}
        for req in promotion.bundle_requirements:
            if item_qty.get(req.product_id, 0) < req.minimum_quantity:
                return []
        req_ids = {r.product_id for r in promotion.bundle_requirements}
        return [i for i in priced_items if i.product_id in req_ids]

    return priced_items
