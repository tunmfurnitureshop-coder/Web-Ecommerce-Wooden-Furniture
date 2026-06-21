import uuid
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete, func
from sqlalchemy.orm import selectinload
from app.modules.collection.models import Collection, CollectionTranslation, CollectionProduct
from app.modules.product.models import Product, ProductTranslation
from app.modules.collection.schemas import (
    CollectionCreateRequest, CollectionUpdateRequest,
    CollectionProductAddRequest, CollectionProductReorderRequest,
    CollectionListItem, CollectionDetailOut, CollectionListResponse,
    CollectionProductItem, SeoOut, BreadcrumbItem,
    CollectionAdminItem, CollectionAdminListResponse,
)
from app.core.exceptions import not_found, conflict, validation_error
from app.shared.enums import CollectionStatus, ProductStatus


def _now():
    return datetime.now(timezone.utc)


def _get_translation(translations, locale: str, fallback: str = "vi"):
    for t in translations:
        if t.locale == locale:
            return t
    for t in translations:
        if t.locale == fallback:
            return t
    return translations[0] if translations else None


async def list_public_collections(
    db: AsyncSession,
    locale: str = "vi",
    featured_only: bool = False,
) -> CollectionListResponse:
    query = (
        select(Collection)
        .where(Collection.status == CollectionStatus.PUBLISHED)
        .options(
            selectinload(Collection.translations),
            selectinload(Collection.product_links),
        )
        .order_by(Collection.sort_order, Collection.published_at.desc())
    )
    if featured_only:
        query = query.where(Collection.is_featured == True)  # noqa: E712

    result = await db.execute(query)
    collections = result.scalars().all()

    items = []
    for col in collections:
        t = _get_translation(col.translations, locale)
        if not t:
            continue
        active_product_count = sum(1 for _ in col.product_links)
        items.append(CollectionListItem(
            id=col.id, code=col.code,
            slug=t.slug, name=t.name,
            short_description=t.short_description,
            cover_image_url=col.cover_image_url,
            is_featured=col.is_featured,
            product_count=active_product_count,
        ))
    return CollectionListResponse(items=items)


async def get_collection_by_slug(
    db: AsyncSession,
    slug: str,
    locale: str = "vi",
) -> CollectionDetailOut:
    trans_result = await db.execute(
        select(CollectionTranslation).where(
            CollectionTranslation.slug == slug,
            CollectionTranslation.locale == locale,
        )
    )
    trans = trans_result.scalar_one_or_none()
    if not trans:
        trans_result = await db.execute(
            select(CollectionTranslation).where(CollectionTranslation.slug == slug)
        )
        trans = trans_result.scalar_one_or_none()
    if not trans:
        raise not_found("Collection")

    col_result = await db.execute(
        select(Collection)
        .where(
            Collection.id == trans.collection_id,
            Collection.status == CollectionStatus.PUBLISHED,
        )
        .options(
            selectinload(Collection.translations),
            selectinload(Collection.product_links),
        )
    )
    collection = col_result.scalar_one_or_none()
    if not collection:
        raise not_found("Collection")

    display_trans = _get_translation(collection.translations, locale)

    product_items = []
    for cp in sorted(collection.product_links, key=lambda x: x.sort_order):
        p_result = await db.execute(
            select(Product, ProductTranslation)
            .join(
                ProductTranslation,
                (ProductTranslation.product_id == Product.id) & (ProductTranslation.locale == locale),
                isouter=True,
            )
            .where(Product.id == cp.product_id, Product.status == ProductStatus.ACTIVE)
        )
        row = p_result.first()
        if not row:
            continue
        p, pt = row
        if pt is None:
            pt_vi = await db.execute(
                select(ProductTranslation).where(
                    ProductTranslation.product_id == p.id,
                    ProductTranslation.locale == "vi",
                )
            )
            pt = pt_vi.scalar_one_or_none()
        if not pt:
            continue
        product_items.append(CollectionProductItem(
            id=p.id, sku=p.sku,
            name=pt.name, slug=pt.slug,
            primary_image_url=p.primary_image_url,
            base_price_vnd=p.base_price_vnd,
            sort_order=cp.sort_order,
        ))

    seo = SeoOut(
        meta_title=display_trans.meta_title or display_trans.name,
        meta_description=display_trans.meta_description or display_trans.short_description,
        og_title=display_trans.og_title or display_trans.meta_title or display_trans.name,
        og_description=display_trans.og_description or display_trans.meta_description,
        og_image_url=display_trans.og_image_url or collection.cover_image_url,
    )

    breadcrumbs = [
        BreadcrumbItem(name="Trang chủ" if locale == "vi" else "首页", href=f"/{locale}"),
        BreadcrumbItem(name="Bộ sưu tập" if locale == "vi" else "系列", href=f"/{locale}/collections"),
        BreadcrumbItem(name=display_trans.name, href=f"/{locale}/collections/{display_trans.slug}"),
    ]

    return CollectionDetailOut(
        id=collection.id, code=collection.code,
        name=display_trans.name, slug=display_trans.slug,
        short_description=display_trans.short_description,
        description_markdown=display_trans.description_markdown,
        cover_image_url=collection.cover_image_url,
        seo=seo,
        products=product_items,
        breadcrumbs=breadcrumbs,
    )


async def admin_list_collections(db: AsyncSession) -> CollectionAdminListResponse:
    result = await db.execute(
        select(Collection)
        .options(selectinload(Collection.translations), selectinload(Collection.product_links))
        .order_by(Collection.sort_order, Collection.created_at.desc())
    )
    collections = result.scalars().all()
    items = [
        CollectionAdminItem(
            id=col.id, code=col.code,
            status=col.status, is_featured=col.is_featured,
            sort_order=col.sort_order, cover_image_url=col.cover_image_url,
            translations=[
                {"locale": t.locale, "name": t.name, "slug": t.slug}
                for t in col.translations
            ],
            product_count=len(col.product_links),
        )
        for col in collections
    ]
    return CollectionAdminListResponse(items=items)


async def admin_get_collection(db: AsyncSession, collection_id: str) -> CollectionAdminItem:
    result = await db.execute(
        select(Collection)
        .where(Collection.id == collection_id)
        .options(selectinload(Collection.translations), selectinload(Collection.product_links))
    )
    col = result.scalar_one_or_none()
    if not col:
        raise not_found("Collection")
    return CollectionAdminItem(
        id=col.id, code=col.code,
        status=col.status, is_featured=col.is_featured,
        sort_order=col.sort_order, cover_image_url=col.cover_image_url,
        translations=[
            {"locale": t.locale, "name": t.name, "slug": t.slug}
            for t in col.translations
        ],
        product_count=len(col.product_links),
    )


async def create_collection(db: AsyncSession, body: CollectionCreateRequest) -> CollectionAdminItem:
    existing = await db.execute(select(Collection).where(Collection.code == body.code))
    if existing.scalar_one_or_none():
        raise conflict("DUPLICATE_CODE", f"Collection code '{body.code}' already exists.")

    col = Collection(
        id=str(uuid.uuid4()),
        code=body.code, status=body.status.value,
        cover_image_url=body.cover_image_url,
        sort_order=body.sort_order, is_featured=body.is_featured,
        created_at=_now(), updated_at=_now(),
    )
    db.add(col)

    for locale, tin in body.translations.items():
        await _check_slug_unique(db, locale, tin.slug)
        db.add(CollectionTranslation(
            id=str(uuid.uuid4()), collection_id=col.id, locale=locale,
            name=tin.name, slug=tin.slug,
            short_description=tin.short_description,
            description_markdown=tin.description_markdown,
            meta_title=tin.meta_title, meta_description=tin.meta_description,
            og_title=tin.og_title, og_description=tin.og_description,
            og_image_url=tin.og_image_url,
            created_at=_now(), updated_at=_now(),
        ))

    await db.commit()
    return await admin_get_collection(db, col.id)


async def update_collection(
    db: AsyncSession, collection_id: str, body: CollectionUpdateRequest
) -> CollectionAdminItem:
    result = await db.execute(
        select(Collection)
        .where(Collection.id == collection_id)
        .options(selectinload(Collection.translations), selectinload(Collection.product_links))
    )
    col = result.scalar_one_or_none()
    if not col:
        raise not_found("Collection")

    if body.status is not None:
        if body.status == CollectionStatus.PUBLISHED:
            await _validate_publishable(db, col)
            col.published_at = _now()
        col.status = body.status.value
        col.updated_at = _now()

    if body.cover_image_url is not None:
        col.cover_image_url = body.cover_image_url
        col.updated_at = _now()
    if body.sort_order is not None:
        col.sort_order = body.sort_order
        col.updated_at = _now()
    if body.is_featured is not None:
        col.is_featured = body.is_featured
        col.updated_at = _now()

    if body.translations:
        for locale, tin in body.translations.items():
            existing_t = next((t for t in col.translations if t.locale == locale), None)
            if existing_t:
                if existing_t.slug != tin.slug:
                    await _check_slug_unique(db, locale, tin.slug)
                existing_t.name = tin.name
                existing_t.slug = tin.slug
                existing_t.short_description = tin.short_description
                existing_t.description_markdown = tin.description_markdown
                existing_t.meta_title = tin.meta_title
                existing_t.meta_description = tin.meta_description
                existing_t.og_title = tin.og_title
                existing_t.og_description = tin.og_description
                existing_t.og_image_url = tin.og_image_url
                existing_t.updated_at = _now()
            else:
                await _check_slug_unique(db, locale, tin.slug)
                db.add(CollectionTranslation(
                    id=str(uuid.uuid4()), collection_id=col.id, locale=locale,
                    name=tin.name, slug=tin.slug,
                    short_description=tin.short_description,
                    description_markdown=tin.description_markdown,
                    meta_title=tin.meta_title, meta_description=tin.meta_description,
                    og_title=tin.og_title, og_description=tin.og_description,
                    og_image_url=tin.og_image_url,
                    created_at=_now(), updated_at=_now(),
                ))

    await db.commit()
    return await admin_get_collection(db, collection_id)


async def delete_collection(db: AsyncSession, collection_id: str) -> None:
    col = (await db.execute(select(Collection).where(Collection.id == collection_id))).scalar_one_or_none()
    if not col:
        raise not_found("Collection")
    await db.execute(delete(CollectionProduct).where(CollectionProduct.collection_id == collection_id))
    await db.execute(delete(CollectionTranslation).where(CollectionTranslation.collection_id == collection_id))
    await db.execute(delete(Collection).where(Collection.id == collection_id))
    await db.commit()


async def add_product_to_collection(
    db: AsyncSession, collection_id: str, body: CollectionProductAddRequest
) -> None:
    col = (await db.execute(select(Collection).where(Collection.id == collection_id))).scalar_one_or_none()
    if not col:
        raise not_found("Collection")

    product = (await db.execute(
        select(Product).where(Product.id == body.product_id)
    )).scalar_one_or_none()
    if not product:
        raise not_found("Product")

    existing = await db.execute(
        select(CollectionProduct).where(
            CollectionProduct.collection_id == collection_id,
            CollectionProduct.product_id == body.product_id,
        )
    )
    if existing.scalar_one_or_none():
        raise conflict("ALREADY_IN_COLLECTION", "Product is already in this collection.")

    db.add(CollectionProduct(
        collection_id=collection_id,
        product_id=body.product_id,
        sort_order=body.sort_order,
        created_at=_now(),
    ))
    await db.commit()


async def reorder_collection_products(
    db: AsyncSession, collection_id: str, body: CollectionProductReorderRequest
) -> None:
    col = (await db.execute(select(Collection).where(Collection.id == collection_id))).scalar_one_or_none()
    if not col:
        raise not_found("Collection")

    result = await db.execute(
        select(CollectionProduct).where(CollectionProduct.collection_id == collection_id)
    )
    links = {cp.product_id: cp for cp in result.scalars().all()}

    for item in body.items:
        cp = links.get(item.product_id)
        if cp:
            cp.sort_order = item.sort_order

    await db.commit()


async def remove_product_from_collection(
    db: AsyncSession, collection_id: str, product_id: str
) -> None:
    result = await db.execute(
        select(CollectionProduct).where(
            CollectionProduct.collection_id == collection_id,
            CollectionProduct.product_id == product_id,
        )
    )
    cp = result.scalar_one_or_none()
    if not cp:
        raise not_found("Product in collection")
    await db.delete(cp)
    await db.commit()


# ── Helpers ──────────────────────────────────────────────────────────────────

async def _check_slug_unique(db: AsyncSession, locale: str, slug: str) -> None:
    existing = await db.execute(
        select(CollectionTranslation).where(
            CollectionTranslation.locale == locale,
            CollectionTranslation.slug == slug,
        )
    )
    if existing.scalar_one_or_none():
        raise conflict("DUPLICATE_SLUG", f"Slug '{slug}' already used for locale '{locale}'.")


async def _validate_publishable(db: AsyncSession, col: Collection) -> None:
    vi_trans = next((t for t in col.translations if t.locale == "vi"), None)
    if not vi_trans:
        raise validation_error("Vietnamese translation is required before publishing.")
    if not vi_trans.slug:
        raise validation_error("Vietnamese slug is required before publishing.")

    active_count = 0
    for cp in col.product_links:
        p = (await db.execute(
            select(Product).where(Product.id == cp.product_id, Product.status == ProductStatus.ACTIVE)
        )).scalar_one_or_none()
        if p:
            active_count += 1

    if active_count == 0:
        raise validation_error("At least one active product is required before publishing.")
