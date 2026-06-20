import uuid
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import selectinload

from app.core.exceptions import not_found
from app.modules.product.models import Product, ProductTranslation
from app.modules.wishlist.models import WishlistItem
from app.modules.wishlist.schemas import WishlistItemOut, WishlistListResponse


def _to_out(item: WishlistItem, product: Product, locale: str) -> WishlistItemOut:
    trans = next((t for t in product.translations if t.locale == locale), None)
    if not trans and product.translations:
        trans = product.translations[0]
    return WishlistItemOut(
        productId=product.id,
        slug=trans.slug if trans else product.sku,
        name=trans.name if trans else product.sku,
        primaryImageUrl=product.primary_image_url,
        basePriceVnd=product.base_price_vnd,
        status=product.status,
        addedAt=item.created_at,
    )


async def list_wishlist(
    db: AsyncSession, customer_id: str, locale: str = "vi"
) -> WishlistListResponse:
    rows = (await db.execute(
        select(WishlistItem, Product, ProductTranslation)
        .join(Product, Product.id == WishlistItem.product_id)
        .outerjoin(
            ProductTranslation,
            (ProductTranslation.product_id == Product.id) & (ProductTranslation.locale == locale),
        )
        .where(WishlistItem.customer_id == customer_id)
        .order_by(WishlistItem.created_at.desc())
    )).all()

    items = []
    for wish_item, product, trans in rows:
        items.append(WishlistItemOut(
            productId=product.id,
            slug=trans.slug if trans else product.sku,
            name=trans.name if trans else product.sku,
            primaryImageUrl=product.primary_image_url,
            basePriceVnd=product.base_price_vnd,
            status=product.status,
            addedAt=wish_item.created_at,
        ))
    return WishlistListResponse(items=items)


async def add_item(
    db: AsyncSession, customer_id: str, product_id: str, locale: str = "vi"
) -> WishlistItemOut:
    product = (await db.execute(
        select(Product).where(Product.id == product_id).options(selectinload(Product.translations))
    )).scalar_one_or_none()
    if not product:
        raise not_found("Product")

    try:
        async with db.begin_nested():  # savepoint — only rolls back the INSERT on conflict
            item = WishlistItem(
                id=str(uuid.uuid4()),
                customer_id=customer_id,
                product_id=product_id,
                created_at=datetime.now(timezone.utc),
            )
            db.add(item)
            await db.flush()
    except IntegrityError:
        item = (await db.execute(
            select(WishlistItem).where(
                WishlistItem.customer_id == customer_id,
                WishlistItem.product_id == product_id,
            )
        )).scalar_one()

    return _to_out(item, product, locale)


async def remove_item(
    db: AsyncSession, customer_id: str, product_id: str
) -> None:
    item = (await db.execute(
        select(WishlistItem).where(
            WishlistItem.customer_id == customer_id,
            WishlistItem.product_id == product_id,
        )
    )).scalar_one_or_none()
    if item:
        await db.delete(item)
