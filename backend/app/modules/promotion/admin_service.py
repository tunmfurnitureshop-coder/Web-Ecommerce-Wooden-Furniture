import uuid
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from app.modules.promotion.models import (
    Promotion, PromotionTranslation, PromotionRedemption,
    PromotionProductTarget, PromotionCategoryTarget,
    PromotionCollectionTarget, PromotionPaymentMethodTarget,
    PromotionBundleRequirement, OrderPromotion,
)
from app.modules.order.models import Order
from app.core.exceptions import AppException
from app.shared.enums import PromotionStatus, PromotionTrigger


def _now() -> datetime:
    return datetime.now(timezone.utc)


async def list_promotions(db: AsyncSession, page: int = 1, page_size: int = 20) -> dict:
    total = (await db.execute(select(func.count(Promotion.id)))).scalar_one()
    promotions = (await db.execute(
        select(Promotion).order_by(Promotion.created_at.desc())
        .offset((page - 1) * page_size).limit(page_size)
    )).scalars().all()
    return {
        "items": [_promo_brief(p) for p in promotions],
        "page": page, "pageSize": page_size, "total": total,
    }


def _promo_brief(p: Promotion) -> dict:
    return {
        "id": p.id, "code": p.code, "trigger": p.trigger, "scopeType": p.scope_type,
        "status": p.status, "discountType": p.discount_type,
        "discountPercentageBps": p.discount_percentage_bps,
        "discountAmountVnd": p.discount_amount_vnd,
        "maxDiscountVnd": p.max_discount_vnd,
        "minOrderValueVnd": p.min_order_value_vnd,
        "priority": p.priority,
        "startsAt": p.starts_at, "endsAt": p.ends_at, "createdAt": p.created_at,
    }


async def get_promotion(db: AsyncSession, promotion_id: str) -> dict:
    p = (await db.execute(select(Promotion).where(Promotion.id == promotion_id))).scalar_one_or_none()
    if not p:
        raise AppException(404, "PROMOTION_NOT_FOUND", "Promotion not found.")
    d = _promo_brief(p)
    d["translations"] = [
        {"locale": t.locale, "name": t.name, "description": t.description, "badgeLabel": t.badge_label}
        for t in p.translations
    ]
    d["productTargets"] = [{"productId": t.product_id} for t in p.product_targets]
    d["categoryTargets"] = [{"roomCategoryId": t.room_category_id} for t in p.category_targets]
    d["collectionTargets"] = [{"collectionId": t.collection_id} for t in p.collection_targets]
    d["paymentMethodTargets"] = [{"paymentMethod": t.payment_method} for t in p.payment_method_targets]
    d["bundleRequirements"] = [
        {"id": r.id, "productId": r.product_id, "minimumQuantity": r.minimum_quantity}
        for r in p.bundle_requirements
    ]
    return d


async def create_promotion(db: AsyncSession, req: dict) -> dict:
    code = req.get("code")
    code_normalized = code.strip().upper() if code else None
    p = Promotion(
        id=str(uuid.uuid4()),
        code=code,
        code_normalized=code_normalized,
        trigger=req["trigger"],
        scope_type=req["scopeType"],
        status=req.get("status", PromotionStatus.DRAFT),
        discount_type=req["discountType"],
        discount_percentage_bps=req.get("discountPercentageBps"),
        discount_amount_vnd=req.get("discountAmountVnd"),
        max_discount_vnd=req.get("maxDiscountVnd"),
        min_order_value_vnd=req.get("minOrderValueVnd"),
        usage_limit_total=req.get("usageLimitTotal"),
        usage_limit_per_customer=req.get("usageLimitPerCustomer"),
        priority=req.get("priority", 100),
        starts_at=req["startsAt"],
        ends_at=req.get("endsAt"),
    )
    db.add(p)
    for locale, t in (req.get("translations") or {}).items():
        db.add(PromotionTranslation(
            promotion_id=p.id, locale=locale,
            name=t.get("name", ""), description=t.get("description"),
            badge_label=t.get("badgeLabel"),
        ))
    await db.commit()
    return {"id": p.id, "code": p.code, "status": p.status}


async def patch_promotion(db: AsyncSession, promotion_id: str, req: dict) -> dict:
    p = (await db.execute(select(Promotion).where(Promotion.id == promotion_id))).scalar_one_or_none()
    if not p:
        raise AppException(404, "PROMOTION_NOT_FOUND", "Promotion not found.")
    field_map = {
        "status": "status", "priority": "priority",
        "discountPercentageBps": "discount_percentage_bps",
        "discountAmountVnd": "discount_amount_vnd",
        "maxDiscountVnd": "max_discount_vnd",
        "minOrderValueVnd": "min_order_value_vnd",
        "usageLimitTotal": "usage_limit_total",
        "usageLimitPerCustomer": "usage_limit_per_customer",
        "startsAt": "starts_at", "endsAt": "ends_at",
    }
    for k, attr in field_map.items():
        if k in req:
            setattr(p, attr, req[k])
    await db.commit()
    return {"id": p.id, "code": p.code, "status": p.status}


async def delete_promotion(db: AsyncSession, promotion_id: str) -> None:
    p = (await db.execute(select(Promotion).where(Promotion.id == promotion_id))).scalar_one_or_none()
    if not p:
        raise AppException(404, "PROMOTION_NOT_FOUND", "Promotion not found.")
    if p.status == PromotionStatus.ACTIVE:
        raise AppException(409, "CANNOT_DELETE_ACTIVE_PROMOTION", "Deactivate promotion before deleting.")
    await db.delete(p)
    await db.commit()


async def add_product_target(db: AsyncSession, promotion_id: str, product_id: str) -> dict:
    db.add(PromotionProductTarget(promotion_id=promotion_id, product_id=product_id))
    await db.commit()
    return {"promotionId": promotion_id, "productId": product_id}


async def remove_product_target(db: AsyncSession, promotion_id: str, product_id: str) -> None:
    t = (await db.execute(select(PromotionProductTarget).where(
        PromotionProductTarget.promotion_id == promotion_id,
        PromotionProductTarget.product_id == product_id,
    ))).scalar_one_or_none()
    if t:
        await db.delete(t)
        await db.commit()


async def add_payment_method_target(db: AsyncSession, promotion_id: str, payment_method: str) -> dict:
    db.add(PromotionPaymentMethodTarget(promotion_id=promotion_id, payment_method=payment_method))
    await db.commit()
    return {"promotionId": promotion_id, "paymentMethod": payment_method}


async def remove_payment_method_target(db: AsyncSession, promotion_id: str, payment_method: str) -> None:
    t = (await db.execute(select(PromotionPaymentMethodTarget).where(
        PromotionPaymentMethodTarget.promotion_id == promotion_id,
        PromotionPaymentMethodTarget.payment_method == payment_method,
    ))).scalar_one_or_none()
    if t:
        await db.delete(t)
        await db.commit()


async def get_promotion_metrics(
    db: AsyncSession,
    promotion_id: str,
    from_dt: Optional[datetime] = None,
    to_dt: Optional[datetime] = None,
) -> dict:
    filters = [PromotionRedemption.promotion_id == promotion_id]
    if from_dt:
        filters.append(PromotionRedemption.reserved_at >= from_dt)
    if to_dt:
        filters.append(PromotionRedemption.reserved_at <= to_dt)

    from app.shared.enums import PromotionRedemptionStatus
    reserved = (await db.execute(
        select(func.count()).where(*filters, PromotionRedemption.status == PromotionRedemptionStatus.RESERVED)
    )).scalar_one()
    redeemed = (await db.execute(
        select(func.count()).where(*filters, PromotionRedemption.status == PromotionRedemptionStatus.REDEEMED)
    )).scalar_one()
    released = (await db.execute(
        select(func.count()).where(*filters, PromotionRedemption.status == PromotionRedemptionStatus.RELEASED)
    )).scalar_one()
    discount_total = (await db.execute(
        select(func.coalesce(func.sum(PromotionRedemption.discount_vnd), 0)).where(
            *filters, PromotionRedemption.status == PromotionRedemptionStatus.REDEEMED
        )
    )).scalar_one()

    order_filters = [OrderPromotion.promotion_id == promotion_id]
    revenue = (await db.execute(
        select(func.coalesce(func.sum(Order.total_vnd), 0))
        .join(OrderPromotion, OrderPromotion.order_id == Order.id)
        .where(*order_filters)
    )).scalar_one()

    avg_order = revenue // redeemed if redeemed else 0

    return {
        "promotionId": promotion_id,
        "usageReserved": reserved,
        "usageRedeemed": redeemed,
        "usageReleased": released,
        "discountTotalVnd": discount_total,
        "revenueAfterDiscountVnd": revenue,
        "averageOrderValueVnd": avg_order,
    }
