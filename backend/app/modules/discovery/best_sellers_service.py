"""Read-side best-sellers: rank products by units sold across paid orders within
a recent window, with a newest-products fallback so the rail is never empty.
"""
from datetime import datetime, timezone, timedelta
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.modules.order.models import Order, OrderItem
from app.modules.product.models import Product, ProductTranslation
from app.modules.discovery.schemas import CategoryProductItem, BestSellerListResponse
from app.shared.enums import ProductStatus, PaymentStatus


async def _to_items(
    db: AsyncSession, product_ids: List[str], locale: str
) -> List[CategoryProductItem]:
    """Resolve product ids (in the given order) to active product cards."""
    if not product_ids:
        return []
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
    trans_map = {}
    for t in trans_rows:
        if t.product_id not in trans_map or t.locale == locale:
            trans_map[t.product_id] = t

    items: List[CategoryProductItem] = []
    for pid in product_ids:  # preserve ranking order
        p = prod_map.get(pid)
        t = trans_map.get(pid)
        if p is None or t is None:
            continue
        items.append(CategoryProductItem(
            id=p.id, name=t.name, slug=t.slug,
            basePriceVnd=p.base_price_vnd, primaryImageUrl=p.primary_image_url,
        ))
    return items


async def get_best_sellers(
    db: AsyncSession, locale: str = "vi", limit: int = 12, days: int = 90
) -> BestSellerListResponse:
    since = datetime.now(timezone.utc) - timedelta(days=days)
    rows = (await db.execute(
        select(OrderItem.product_id, func.sum(OrderItem.quantity).label("units"))
        .join(Order, Order.id == OrderItem.order_id)
        .where(Order.payment_status == PaymentStatus.PAID, Order.created_at >= since)
        .group_by(OrderItem.product_id)
        .order_by(func.sum(OrderItem.quantity).desc())
        .limit(limit)
    )).all()
    items = await _to_items(db, [r[0] for r in rows], locale)

    # Fallback so the rail is never empty: top up with newest active products.
    if len(items) < limit:
        seen = {i.id for i in items}
        newest_ids = (await db.execute(
            select(Product.id)
            .where(Product.status == ProductStatus.ACTIVE)
            .order_by(Product.created_at.desc())
        )).scalars().all()
        fill_ids = [pid for pid in newest_ids if pid not in seen][: limit - len(items)]
        items += await _to_items(db, fill_ids, locale)

    return BestSellerListResponse(items=items[:limit])
