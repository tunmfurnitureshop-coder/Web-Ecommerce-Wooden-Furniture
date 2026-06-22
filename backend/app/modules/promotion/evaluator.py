from dataclasses import dataclass, field
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.modules.promotion.models import Promotion
from app.modules.promotion.schemas import (
    CartQuoteRequest, CartQuoteResponse, QuotedCartItem,
    AppliedPromotionOut, CouponResultOut,
)
from app.modules.promotion.eligibility import (
    PricedItem, check_date_range, check_payment_method,
    check_min_order, check_usage_limits, get_eligible_items,
)
from app.modules.promotion.allocation import LineAllocation, allocate_discount
from app.modules.pricing.service import calculate_quote
from app.modules.pricing.schemas import PricingQuoteRequest, SelectedOptionsIn
from app.modules.product.models import Product
from app.shared.enums import PromotionStatus, PromotionTrigger


@dataclass
class EvaluationResult:
    promotion: Promotion
    eligible: bool
    rejection_reason: Optional[str]
    discount_vnd: int = 0
    line_allocations: list = field(default_factory=list)


_COUPON_MESSAGES = {
    "INVALID": "Mã giảm giá không hợp lệ.",
    "EXPIRED": "Mã giảm giá đã hết hạn.",
    "NOT_STARTED": "Mã giảm giá chưa có hiệu lực.",
    "USAGE_LIMIT_REACHED": "Mã giảm giá đã đạt giới hạn sử dụng.",
    "CUSTOMER_USAGE_LIMIT_REACHED": "Bạn đã sử dụng mã giảm giá này.",
    "MIN_ORDER_NOT_REACHED": "Đơn hàng chưa đạt giá trị tối thiểu để áp dụng ưu đãi.",
    "PAYMENT_METHOD_NOT_ELIGIBLE": "Phương thức thanh toán không đủ điều kiện áp dụng ưu đãi.",
    "PRODUCT_NOT_ELIGIBLE": "Sản phẩm không đủ điều kiện áp dụng ưu đãi.",
}


async def _price_items(items: list, db: AsyncSession) -> list[PricedItem]:
    priced = []
    for item in items:
        opts = item.selectedOptions
        quote = await calculate_quote(db, PricingQuoteRequest(
            productId=item.productId,
            quantity=item.quantity,
            selectedOptions=SelectedOptionsIn(
                woodType=opts.get("woodType", ""),
                finish=opts.get("finish", ""),
                size=opts.get("size", ""),
            ),
        ))
        product = (await db.execute(select(Product).where(Product.id == item.productId))).scalar_one()
        priced.append(PricedItem(
            product_id=item.productId,
            quantity=item.quantity,
            unit_price_vnd=quote.unitPriceVnd,
            line_total_vnd=quote.lineTotalVnd,
            room_category_id=product.room_category_id,
        ))
    return priced


async def _evaluate(
    promotion: Promotion,
    priced_items: list[PricedItem],
    payment_method: str,
    customer_id: Optional[str],
    db: AsyncSession,
) -> EvaluationResult:
    def _reject(reason: str) -> EvaluationResult:
        return EvaluationResult(promotion, False, reason)

    if promotion.status != PromotionStatus.ACTIVE:
        return _reject("INVALID")
    reason = check_date_range(promotion)
    if reason:
        return _reject(reason)
    reason = check_payment_method(promotion, payment_method)
    if reason:
        return _reject(reason)
    reason = await check_usage_limits(promotion, customer_id, None, db)
    if reason:
        return _reject(reason)
    eligible_items = await get_eligible_items(promotion, priced_items, db)
    if not eligible_items:
        return _reject("PRODUCT_NOT_ELIGIBLE")
    eligible_subtotal = sum(i.line_total_vnd for i in eligible_items)
    reason = check_min_order(promotion, eligible_subtotal)
    if reason:
        return _reject(reason)
    discount_vnd, line_allocs = allocate_discount(promotion, eligible_items)
    return EvaluationResult(promotion, True, None, discount_vnd, line_allocs)


def _select_best(candidates: list[EvaluationResult]) -> Optional[EvaluationResult]:
    eligible = [c for c in candidates if c.eligible]
    if not eligible:
        return None
    return sorted(
        eligible,
        key=lambda c: (
            -c.discount_vnd,
            c.promotion.priority,
            0 if c.promotion.trigger == PromotionTrigger.COUPON else 1,
        ),
    )[0]


def _coupon_out(
    submitted_code: Optional[str],
    coupon_eval: Optional[EvaluationResult],
    selected: Optional[EvaluationResult],
) -> Optional[CouponResultOut]:
    if not submitted_code:
        return None
    code = submitted_code.strip().upper()
    if coupon_eval is None:
        return CouponResultOut(submittedCode=code, status="INVALID", message=_COUPON_MESSAGES["INVALID"])
    if not coupon_eval.eligible:
        status = coupon_eval.rejection_reason or "INVALID"
        return CouponResultOut(submittedCode=code, status=status, message=_COUPON_MESSAGES.get(status, _COUPON_MESSAGES["INVALID"]))
    if selected and selected.promotion.id == coupon_eval.promotion.id:
        return CouponResultOut(submittedCode=code, status="APPLIED", message="Mã giảm giá đã được áp dụng.")
    return CouponResultOut(submittedCode=code, status="VALID_BUT_NOT_SELECTED", message="Ưu đãi tự động tốt hơn đã được áp dụng.")


def _promo_out(selected: EvaluationResult) -> AppliedPromotionOut:
    p = selected.promotion
    trans = next((t for t in p.translations if t.locale == "vi"), None)
    name = trans.name if trans else (p.code or p.id)
    return AppliedPromotionOut(
        id=p.id, code=p.code, name=name, trigger=p.trigger,
        scopeType=p.scope_type,
        discountType=p.discount_type, discountVnd=selected.discount_vnd,
        selectionReason="BEST_ELIGIBLE_PROMOTION",
    )


async def quote_cart(
    req: CartQuoteRequest,
    db: AsyncSession,
    customer_id: Optional[str] = None,
) -> CartQuoteResponse:
    priced_items = await _price_items(req.items, db)
    coupon_eval: Optional[EvaluationResult] = None
    candidates: list[EvaluationResult] = []

    if req.couponCode:
        normalized = req.couponCode.strip().upper()
        result = await db.execute(
            select(Promotion).where(
                Promotion.code_normalized == normalized,
                Promotion.trigger == PromotionTrigger.COUPON,
            )
        )
        coupon = result.scalar_one_or_none()
        if coupon:
            coupon_eval = await _evaluate(coupon, priced_items, req.paymentMethod, customer_id, db)
            if coupon_eval.eligible:
                candidates.append(coupon_eval)

    auto_result = await db.execute(
        select(Promotion).where(
            Promotion.trigger == PromotionTrigger.AUTOMATIC,
            Promotion.status == PromotionStatus.ACTIVE,
        )
    )
    for promo in auto_result.scalars().all():
        result = await _evaluate(promo, priced_items, req.paymentMethod, customer_id, db)
        if result.eligible:
            candidates.append(result)

    selected = _select_best(candidates)
    alloc_map = {a.product_id: a.discount_vnd for a in selected.line_allocations} if selected else {}

    quoted = [
        QuotedCartItem(
            productId=i.product_id, quantity=i.quantity,
            unitPriceVnd=i.unit_price_vnd, lineTotalVnd=i.line_total_vnd,
            promotionDiscountVnd=alloc_map.get(i.product_id, 0),
            finalLineTotalVnd=i.line_total_vnd - alloc_map.get(i.product_id, 0),
        )
        for i in priced_items
    ]

    merch_total = sum(i.lineTotalVnd for i in quoted)
    promo_discount = selected.discount_vnd if selected else 0

    return CartQuoteResponse(
        items=quoted,
        merchandiseSubtotalVnd=merch_total,
        promotionDiscountVnd=promo_discount,
        shippingFeeVnd=0,
        shippingDiscountVnd=0,
        totalDiscountVnd=promo_discount,
        totalVnd=merch_total - promo_discount,
        appliedPromotion=_promo_out(selected) if selected else None,
        coupon=_coupon_out(req.couponCode, coupon_eval, selected),
    )
