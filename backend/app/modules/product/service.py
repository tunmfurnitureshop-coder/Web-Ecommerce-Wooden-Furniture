from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_
from sqlalchemy.orm import selectinload
from app.modules.product.models import Product, ProductTranslation, RoomCategory, RoomCategoryTranslation
from app.modules.inventory.models import (
    WoodType, FinishOption, SizeOption,
    ProductWoodType, ProductFinishOption, ProductSizeOption, InventoryItem
)
from app.modules.product.schemas import (
    ProductCatalogItem, ProductCatalogResponse, AppliedFilters, ProductDetailOut,
    AvailableOptions, WoodTypeOptionOut, FinishOptionOut, SizeOptionOut,
    RoomOut, CreateProductRequest, UpdateProductRequest,
    AdminProductItem, AdminProductListResponse, InventoryOut
)
from app.core.exceptions import not_found, conflict, validation_error
from app.shared.enums import ProductStatus, ReviewStatus
import uuid


def _get_translation(translations, locale: str, fallback: str = "vi"):
    for t in translations:
        if t.locale == locale:
            return t
    for t in translations:
        if t.locale == fallback:
            return t
    return translations[0] if translations else None


async def get_catalog(
    db: AsyncSession,
    locale: str = "vi",
    q: Optional[str] = None,
    room: Optional[str] = None,
    wood_type: Optional[str] = None,
    min_price: Optional[int] = None,
    max_price: Optional[int] = None,
    sort: str = "newest",
    page: int = 1,
    page_size: int = 12,
) -> ProductCatalogResponse:
    from app.modules.review.models import ProductReview

    query = (
        select(Product)
        .where(Product.status == ProductStatus.ACTIVE)
        .options(
            selectinload(Product.translations),
            selectinload(Product.room_category).selectinload(RoomCategory.translations),
            selectinload(Product.inventory),
            selectinload(Product.wood_types).selectinload(ProductWoodType.wood_type),
        )
    )

    if q:
        query = query.join(
            ProductTranslation,
            and_(ProductTranslation.product_id == Product.id, ProductTranslation.locale == locale),
            isouter=True,
        ).where(
            or_(
                ProductTranslation.name.ilike(f"%{q}%"),
                ProductTranslation.short_description.ilike(f"%{q}%"),
                ProductTranslation.description.ilike(f"%{q}%"),
            )
        )

    if room:
        cat_sub = select(RoomCategory.id).join(
            RoomCategoryTranslation,
            and_(RoomCategoryTranslation.category_id == RoomCategory.id, RoomCategoryTranslation.slug == room)
        )
        query = query.where(Product.room_category_id.in_(cat_sub))

    if wood_type:
        wt_sub = select(ProductWoodType.product_id).join(
            WoodType, and_(WoodType.id == ProductWoodType.wood_type_id, WoodType.code == wood_type)
        )
        query = query.where(Product.id.in_(wt_sub))

    if min_price is not None:
        query = query.where(Product.base_price_vnd >= min_price)
    if max_price is not None:
        query = query.where(Product.base_price_vnd <= max_price)

    if sort == "price_asc":
        query = query.order_by(Product.base_price_vnd.asc())
    elif sort == "price_desc":
        query = query.order_by(Product.base_price_vnd.desc())
    elif sort == "rating_desc":
        avg_rating_sq = (
            select(
                ProductReview.product_id,
                func.coalesce(func.avg(ProductReview.rating), 0).label("avg_rating"),
                func.count(ProductReview.id).label("review_count"),
            )
            .where(ProductReview.status == ReviewStatus.APPROVED)
            .group_by(ProductReview.product_id)
            .subquery()
        )
        query = (
            query.outerjoin(avg_rating_sq, avg_rating_sq.c.product_id == Product.id)
            .order_by(
                func.coalesce(avg_rating_sq.c.avg_rating, 0).desc(),
                func.coalesce(avg_rating_sq.c.review_count, 0).desc(),
                Product.created_at.desc(),
            )
        )
    elif sort == "relevance" and q:
        query = query.order_by(
            func.similarity(ProductTranslation.name, q).desc(),
            Product.created_at.desc(),
        )
    else:
        query = query.order_by(Product.created_at.desc())

    count_result = await db.execute(select(func.count()).select_from(query.subquery()))
    total = count_result.scalar_one()

    query = query.offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    products = result.scalars().all()

    items = []
    for p in products:
        trans = _get_translation(p.translations, locale)
        if not trans:
            continue
        room_trans = _get_translation(p.room_category.translations, locale)
        items.append(ProductCatalogItem(
            id=p.id,
            sku=p.sku,
            name=trans.name,
            slug=trans.slug,
            shortDescription=trans.short_description,
            basePriceVnd=p.base_price_vnd,
            primaryImageUrl=p.primary_image_url,
            room=RoomOut(
                code=p.room_category.code,
                name=room_trans.name if room_trans else p.room_category.code,
            ),
        ))

    return ProductCatalogResponse(
        items=items,
        page=page,
        pageSize=page_size,
        total=total,
        query=q or None,
        appliedFilters=AppliedFilters(
            room=room,
            woodType=wood_type,
            minPrice=min_price,
            maxPrice=max_price,
            sort=sort,
        ),
    )


async def get_suggestions(db: AsyncSession, q: str, locale: str = "vi") -> dict:
    if len(q) < 2:
        return {"products": [], "categories": [], "woodTypes": []}

    product_rows = (await db.execute(
        select(Product, ProductTranslation)
        .join(
            ProductTranslation,
            and_(ProductTranslation.product_id == Product.id, ProductTranslation.locale == locale),
        )
        .where(
            Product.status == ProductStatus.ACTIVE,
            ProductTranslation.name.ilike(f"%{q}%"),
        )
        .limit(5)
    )).all()

    cat_rows = (await db.execute(
        select(RoomCategory, RoomCategoryTranslation)
        .join(
            RoomCategoryTranslation,
            and_(
                RoomCategoryTranslation.category_id == RoomCategory.id,
                RoomCategoryTranslation.locale == locale,
            ),
        )
        .where(RoomCategoryTranslation.name.ilike(f"%{q}%"), RoomCategory.is_active == True)  # noqa: E712
        .limit(5)
    )).all()

    from app.modules.inventory.models import WoodType, WoodTypeTranslation
    wt_rows = (await db.execute(
        select(WoodType, WoodTypeTranslation)
        .join(
            WoodTypeTranslation,
            and_(WoodTypeTranslation.wood_type_id == WoodType.id, WoodTypeTranslation.locale == locale),
        )
        .where(WoodTypeTranslation.name.ilike(f"%{q}%"), WoodType.is_active == True)  # noqa: E712
        .limit(5)
    )).all()

    return {
        "products": [
            {"slug": t.slug, "name": t.name, "primaryImageUrl": p.primary_image_url}
            for p, t in product_rows
        ],
        "categories": [{"code": c.code, "name": t.name} for c, t in cat_rows],
        "woodTypes": [{"code": w.code, "name": t.name} for w, t in wt_rows],
    }


async def get_product_detail(db: AsyncSession, slug: str, locale: str = "vi") -> ProductDetailOut:
    trans_result = await db.execute(
        select(ProductTranslation).where(ProductTranslation.slug == slug, ProductTranslation.locale == locale)
    )
    trans = trans_result.scalar_one_or_none()
    if not trans:
        trans_result = await db.execute(
            select(ProductTranslation).where(ProductTranslation.slug == slug)
        )
        trans = trans_result.scalar_one_or_none()
    if not trans:
        raise not_found("Product")

    p_result = await db.execute(
        select(Product)
        .where(Product.id == trans.product_id, Product.status == ProductStatus.ACTIVE)
        .options(
            selectinload(Product.translations),
            selectinload(Product.wood_types).selectinload(ProductWoodType.wood_type).selectinload(WoodType.translations),
            selectinload(Product.finish_options).selectinload(ProductFinishOption.finish_option).selectinload(FinishOption.translations),
            selectinload(Product.size_options).selectinload(ProductSizeOption.size_option).selectinload(SizeOption.translations),
        )
    )
    product = p_result.scalar_one_or_none()
    if not product:
        raise not_found("Product")

    display_trans = _get_translation(product.translations, locale)

    wood_outs = []
    for pwt in product.wood_types:
        wt = pwt.wood_type
        if not wt.is_active:
            continue
        wt_trans = _get_translation(wt.translations, locale)
        wood_outs.append(WoodTypeOptionOut(code=wt.code, name=wt_trans.name if wt_trans else wt.code, priceDeltaVnd=wt.price_delta_vnd))

    finish_outs = []
    for pfo in product.finish_options:
        fo = pfo.finish_option
        if not fo.is_active:
            continue
        fo_trans = _get_translation(fo.translations, locale)
        finish_outs.append(FinishOptionOut(code=fo.code, name=fo_trans.name if fo_trans else fo.code, priceDeltaVnd=fo.price_delta_vnd, imageUrl=pfo.image_url))

    size_outs = []
    for pso in product.size_options:
        so = pso.size_option
        if not so.is_active:
            continue
        so_trans = _get_translation(so.translations, locale)
        size_outs.append(SizeOptionOut(
            code=so.code, name=so_trans.name if so_trans else so.code,
            widthCm=so.width_cm, depthCm=so.depth_cm, heightCm=so.height_cm,
            priceDeltaVnd=so.price_delta_vnd
        ))

    from app.modules.media.models import ProductImage
    from app.modules.product.schemas import ProductImageItem
    img_rows = (await db.execute(
        select(ProductImage).where(ProductImage.product_id == product.id).order_by(ProductImage.sort_order)
    )).scalars().all()
    image_items = [
        ProductImageItem(
            id=img.id, imageUrl=img.image_url, altText=img.alt_text,
            sortOrder=img.sort_order, isPrimary=img.is_primary, linkedFinishCode=img.linked_finish_code,
        )
        for img in img_rows
    ]

    return ProductDetailOut(
        id=product.id, sku=product.sku,
        name=display_trans.name, slug=display_trans.slug,
        description=display_trans.description, shortDescription=display_trans.short_description,
        specifications=display_trans.specifications,
        basePriceVnd=product.base_price_vnd,
        primaryImageUrl=product.primary_image_url,
        availableOptions=AvailableOptions(woodTypes=wood_outs, finishes=finish_outs, sizes=size_outs),
        images=image_items,
    )


async def admin_list_products(db: AsyncSession) -> AdminProductListResponse:
    result = await db.execute(
        select(Product).options(
            selectinload(Product.translations),
            selectinload(Product.inventory),
        )
    )
    products = result.scalars().all()
    items = []
    for p in products:
        vi_trans = _get_translation(p.translations, "vi")
        inv = p.inventory
        items.append(AdminProductItem(
            id=p.id, sku=p.sku,
            nameVi=vi_trans.name if vi_trans else p.sku,
            basePriceVnd=p.base_price_vnd,
            status=p.status,
            inventory=InventoryOut(
                totalQty=inv.total_qty if inv else 0,
                reservedQty=inv.reserved_qty if inv else 0,
                availableQty=inv.available_qty if inv else 0,
            ),
        ))
    return AdminProductListResponse(items=items)


async def admin_get_product(db: AsyncSession, product_id: str) -> AdminProductItem:
    result = await db.execute(
        select(Product).where(Product.id == product_id).options(
            selectinload(Product.translations),
            selectinload(Product.inventory),
        )
    )
    product = result.scalar_one_or_none()
    if not product:
        raise not_found("Product")
    vi_trans = _get_translation(product.translations, "vi")
    inv = product.inventory
    return AdminProductItem(
        id=product.id, sku=product.sku,
        nameVi=vi_trans.name if vi_trans else product.sku,
        basePriceVnd=product.base_price_vnd,
        status=product.status,
        inventory=InventoryOut(
            totalQty=inv.total_qty if inv else 0,
            reservedQty=inv.reserved_qty if inv else 0,
            availableQty=inv.available_qty if inv else 0,
        ),
    )


async def create_product(db: AsyncSession, body: CreateProductRequest) -> dict:
    if "vi" not in body.translations:
        raise validation_error("Vietnamese translation is required.")

    existing = await db.execute(select(Product).where(Product.sku == body.sku))
    if existing.scalar_one_or_none():
        raise conflict("DUPLICATE_SKU", f"SKU '{body.sku}' already exists.")

    cat_result = await db.execute(select(RoomCategory).where(RoomCategory.code == body.roomCategoryCode))
    category = cat_result.scalar_one_or_none()
    if not category:
        raise not_found(f"Room category '{body.roomCategoryCode}'")

    product = Product(
        id=str(uuid.uuid4()), sku=body.sku,
        room_category_id=category.id, base_price_vnd=body.basePriceVnd,
        primary_image_url=body.primaryImageUrl, status=body.status,
    )
    db.add(product)

    for locale, t in body.translations.items():
        db.add(ProductTranslation(
            id=str(uuid.uuid4()), product_id=product.id, locale=locale,
            name=t.name, slug=t.slug, short_description=t.shortDescription,
            description=t.description, specifications=t.specifications,
        ))

    for wt_code in body.optionCodes.woodTypes:
        wt = (await db.execute(select(WoodType).where(WoodType.code == wt_code))).scalar_one_or_none()
        if wt:
            db.add(ProductWoodType(id=str(uuid.uuid4()), product_id=product.id, wood_type_id=wt.id))

    for fo_code in body.optionCodes.finishes:
        fo = (await db.execute(select(FinishOption).where(FinishOption.code == fo_code))).scalar_one_or_none()
        if fo:
            db.add(ProductFinishOption(id=str(uuid.uuid4()), product_id=product.id, finish_option_id=fo.id))

    for so_code in body.optionCodes.sizes:
        so = (await db.execute(select(SizeOption).where(SizeOption.code == so_code))).scalar_one_or_none()
        if so:
            db.add(ProductSizeOption(id=str(uuid.uuid4()), product_id=product.id, size_option_id=so.id))

    db.add(InventoryItem(id=str(uuid.uuid4()), product_id=product.id, total_qty=body.inventory.totalQty))

    await db.commit()
    return {"id": product.id, "sku": product.sku}


async def update_product(db: AsyncSession, product_id: str, body: UpdateProductRequest) -> dict:
    result = await db.execute(
        select(Product)
        .where(Product.id == product_id)
        .options(
            selectinload(Product.translations),
            selectinload(Product.inventory),
            selectinload(Product.wood_types),
            selectinload(Product.finish_options),
            selectinload(Product.size_options),
        )
    )
    product = result.scalar_one_or_none()
    if not product:
        raise not_found("Product")

    if body.sku is not None:
        product.sku = body.sku
    if body.basePriceVnd is not None:
        product.base_price_vnd = body.basePriceVnd
    if body.primaryImageUrl is not None:
        product.primary_image_url = body.primaryImageUrl
    if body.status is not None:
        product.status = body.status

    if body.roomCategoryCode is not None:
        cat = (await db.execute(select(RoomCategory).where(RoomCategory.code == body.roomCategoryCode))).scalar_one_or_none()
        if not cat:
            raise not_found(f"Room category '{body.roomCategoryCode}'")
        product.room_category_id = cat.id

    if body.translations:
        for locale, t in body.translations.items():
            existing_t = next((x for x in product.translations if x.locale == locale), None)
            if existing_t:
                existing_t.name = t.name
                existing_t.slug = t.slug
                existing_t.short_description = t.shortDescription
                existing_t.description = t.description
                existing_t.specifications = t.specifications
            else:
                db.add(ProductTranslation(
                    id=str(uuid.uuid4()), product_id=product.id, locale=locale,
                    name=t.name, slug=t.slug, short_description=t.shortDescription,
                    description=t.description, specifications=t.specifications,
                ))

    if body.inventory and product.inventory:
        product.inventory.total_qty = body.inventory.totalQty

    await db.commit()
    return {"id": product.id}
