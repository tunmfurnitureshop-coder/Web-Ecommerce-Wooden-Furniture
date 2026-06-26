"""Read-side deals: compute display strike-through prices for products that have
an active AUTOMATIC promotion. Reuses the checkout discount engine
(``allocate_discount``) so card prices stay consistent with ``/cart/quote``.

Honesty rule — only unconditional product/category promotions are shown, so the
strike-through price is what the buyer actually gets with no extra steps.
"""
from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.modules.promotion.models import Promotion
from app.modules.promotion.eligibility import PricedItem, check_date_range
from app.modules.promotion.allocation import allocate_discount
from app.modules.promotion.schemas import ProductDealItem, DealListResponse
from app.modules.product.models import Product, ProductTranslation
from app.shared.enums import (
    PromotionStatus, PromotionTrigger, PromotionScopeType, ProductStatus,
)


def _badge_label(promo: Promotion, locale: str) -> Optional[str]:
    trans = next((t for t in promo.translations if t.locale == locale), None)
    if trans is None:
        trans = next((t for t in promo.translations if t.locale == "vi"), None)
    if trans is None:
        return None
    return trans.badge_label or trans.name


def _is_unconditional(promo: Promotion) -> bool:
    """A deal price is only honest when the discount needs nothing beyond buying
    the product: in its active window, no minimum order, no bundle requirement,
    no payment-method restriction."""
    if check_date_range(promo) is not None:
        return False
    if promo.min_order_value_vnd:
        return False
    if promo.bundle_requirements:
        return False
    if promo.payment_method_targets:
        return False
    return True


async def _candidate_products(
    db: AsyncSession, promos: List[Promotion]
) -> dict[str, List[Promotion]]:
    """Map each eligible product id to the promotions that target it."""
    product_promos: dict[str, List[Promotion]] = {}
    for p in promos:
        if p.scope_type == PromotionScopeType.PRODUCT:
            for t in p.product_targets:
                product_promos.setdefault(t.product_id, []).append(p)
        else:  # CATEGORY
            cat_ids = [t.room_category_id for t in p.category_targets]
            if not cat_ids:
                continue
            pid_rows = (await db.execute(
                select(Product.id).where(
                    Product.room_category_id.in_(cat_ids),
                    Product.status == ProductStatus.ACTIVE,
                )
            )).scalars().all()
            for pid in pid_rows:
                product_promos.setdefault(pid, []).append(p)
    return product_promos


async def get_active_deals(
    db: AsyncSession, locale: str = "vi", limit: int = 12
) -> DealListResponse:
    promos = (await db.execute(
        select(Promotion).where(
            Promotion.trigger == PromotionTrigger.AUTOMATIC,
            Promotion.status == PromotionStatus.ACTIVE,
            Promotion.scope_type.in_([PromotionScopeType.PRODUCT, PromotionScopeType.CATEGORY]),
        )
    )).scalars().all()

    eligible = [p for p in promos if _is_unconditional(p)]
    if not eligible:
        return DealListResponse(items=[])

    product_promos = await _candidate_products(db, eligible)
    if not product_promos:
        return DealListResponse(items=[])

    product_ids = list(product_promos.keys())
    prods = (await db.execute(
        select(Product).where(
            Product.id.in_(product_ids), Product.status == ProductStatus.ACTIVE
        )
    )).scalars().all()
    prod_map = {p.id: p for p in prods}

    trans_rows = (await db.execute(
        select(ProductTranslation).where(
            ProductTranslation.product_id.in_(product_ids),
            ProductTranslation.locale.in_([locale, "vi"]),
        )
    )).scalars().all()
    trans_map: dict[str, ProductTranslation] = {}
    for t in trans_rows:
        if t.product_id not in trans_map or t.locale == locale:
            trans_map[t.product_id] = t

    items: List[ProductDealItem] = []
    for pid, promos_for in product_promos.items():
        product = prod_map.get(pid)
        trans = trans_map.get(pid)
        if product is None or trans is None:
            continue
        base = product.base_price_vnd
        priced = [PricedItem(product.id, 1, base, base, product.room_category_id)]
        best_discount = 0
        best_promo: Optional[Promotion] = None
        for promo in promos_for:
            discount, _ = allocate_discount(promo, priced)
            if discount > best_discount or (
                discount == best_discount and best_promo is not None
                and promo.priority < best_promo.priority
            ):
                best_discount = discount
                best_promo = promo
        if best_discount <= 0 or best_promo is None:
            continue
        items.append(ProductDealItem(
            id=product.id, name=trans.name, slug=trans.slug,
            primaryImageUrl=product.primary_image_url,
            originalPriceVnd=base,
            dealPriceVnd=base - best_discount,
            discountPct=round(best_discount / base * 100) if base else 0,
            badgeLabel=_badge_label(best_promo, locale),
        ))

    items.sort(key=lambda x: (-x.discountPct, -(x.originalPriceVnd - x.dealPriceVnd)))
    return DealListResponse(items=items[:limit])
