import uuid
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete, func
from sqlalchemy.orm import selectinload
from app.modules.content.models import (
    ContentPost, ContentPostTranslation, ContentPostProduct, ContentPostCategory,
)
from app.modules.product.models import Product, ProductTranslation, RoomCategory, RoomCategoryTranslation
from app.modules.content.schemas import (
    ContentCreateRequest, ContentUpdateRequest,
    ContentProductLinkRequest, ContentCategoryLinkRequest,
    ContentListItem, ContentDetailOut, ContentListResponse,
    LinkedProductItem, LinkedCategoryItem, RelatedGuideItem,
    SeoOut, BreadcrumbItem,
    ContentAdminItem, ContentAdminListResponse,
)
from app.core.exceptions import not_found, conflict, validation_error
from app.shared.enums import ContentStatus, ProductStatus


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


async def list_public_content(
    db: AsyncSession,
    locale: str = "vi",
    type_filter: Optional[str] = None,
    page: int = 1,
    page_size: int = 12,
) -> ContentListResponse:
    now = _now()
    query = (
        select(ContentPost)
        .where(
            ContentPost.status == ContentStatus.PUBLISHED,
            ContentPost.published_at <= now,
        )
        .options(selectinload(ContentPost.translations))
    )
    if type_filter:
        query = query.where(ContentPost.type == type_filter.upper())
    query = query.order_by(ContentPost.published_at.desc())

    count_result = await db.execute(select(func.count()).select_from(query.subquery()))
    total = count_result.scalar_one()

    result = await db.execute(query.offset((page - 1) * page_size).limit(page_size))
    posts = result.scalars().all()

    items = []
    for post in posts:
        t = _get_translation(post.translations, locale)
        if not t:
            continue
        items.append(ContentListItem(
            id=post.id, type=post.type,
            title=t.title, slug=t.slug, excerpt=t.excerpt,
            cover_image_url=post.cover_image_url,
            author_name=post.author_name,
            published_at=post.published_at,
        ))
    return ContentListResponse(items=items, page=page, page_size=page_size, total=total)


async def get_public_content_by_slug(
    db: AsyncSession, slug: str, locale: str = "vi"
) -> ContentDetailOut:
    now = _now()
    trans_result = await db.execute(
        select(ContentPostTranslation).where(
            ContentPostTranslation.slug == slug,
            ContentPostTranslation.locale == locale,
        )
    )
    trans = trans_result.scalar_one_or_none()
    if not trans:
        trans_result = await db.execute(
            select(ContentPostTranslation).where(ContentPostTranslation.slug == slug)
        )
        trans = trans_result.scalar_one_or_none()
    if not trans:
        raise not_found("Guide")

    post_result = await db.execute(
        select(ContentPost)
        .where(
            ContentPost.id == trans.content_post_id,
            ContentPost.status == ContentStatus.PUBLISHED,
            ContentPost.published_at <= now,
        )
        .options(
            selectinload(ContentPost.translations),
            selectinload(ContentPost.product_links),
            selectinload(ContentPost.category_links),
        )
    )
    post = post_result.scalar_one_or_none()
    if not post:
        raise not_found("Guide")

    display_trans = _get_translation(post.translations, locale)

    linked_products = await _load_linked_products(db, post, locale)
    linked_categories = await _load_linked_categories(db, post, locale)
    related_guides = await _load_related_guides(db, post, locale)

    seo = SeoOut(
        meta_title=display_trans.meta_title or display_trans.title,
        meta_description=display_trans.meta_description or display_trans.excerpt,
        og_title=display_trans.og_title or display_trans.meta_title or display_trans.title,
        og_description=display_trans.og_description or display_trans.meta_description or display_trans.excerpt,
        og_image_url=display_trans.og_image_url or post.cover_image_url,
    )

    breadcrumbs = [
        BreadcrumbItem(name="Trang chủ" if locale == "vi" else "首页", href=f"/{locale}"),
        BreadcrumbItem(name="Hướng dẫn" if locale == "vi" else "指南", href=f"/{locale}/guides"),
        BreadcrumbItem(name=display_trans.title, href=f"/{locale}/guides/{display_trans.slug}"),
    ]

    return ContentDetailOut(
        id=post.id, type=post.type,
        title=display_trans.title, slug=display_trans.slug,
        excerpt=display_trans.excerpt,
        body_markdown=display_trans.body_markdown,
        cover_image_url=post.cover_image_url,
        author_name=post.author_name,
        published_at=post.published_at,
        linked_products=linked_products,
        linked_categories=linked_categories,
        seo=seo,
        breadcrumbs=breadcrumbs,
        related_guides=related_guides,
    )


async def admin_list_content(db: AsyncSession) -> ContentAdminListResponse:
    result = await db.execute(
        select(ContentPost)
        .options(selectinload(ContentPost.translations))
        .order_by(ContentPost.updated_at.desc())
    )
    posts = result.scalars().all()
    items = [
        ContentAdminItem(
            id=p.id, type=p.type, status=p.status,
            cover_image_url=p.cover_image_url, author_name=p.author_name,
            published_at=p.published_at, scheduled_at=p.scheduled_at,
            translations=[
                {"locale": t.locale, "title": t.title, "slug": t.slug}
                for t in p.translations
            ],
        )
        for p in posts
    ]
    return ContentAdminListResponse(items=items)


async def admin_get_content(db: AsyncSession, content_id: str) -> ContentAdminItem:
    result = await db.execute(
        select(ContentPost)
        .where(ContentPost.id == content_id)
        .options(selectinload(ContentPost.translations))
    )
    post = result.scalar_one_or_none()
    if not post:
        raise not_found("Content")
    return ContentAdminItem(
        id=post.id, type=post.type, status=post.status,
        cover_image_url=post.cover_image_url, author_name=post.author_name,
        published_at=post.published_at, scheduled_at=post.scheduled_at,
        translations=[
            {"locale": t.locale, "title": t.title, "slug": t.slug}
            for t in post.translations
        ],
    )


async def create_content(db: AsyncSession, body: ContentCreateRequest) -> ContentAdminItem:
    post = ContentPost(
        id=str(uuid.uuid4()),
        type=body.type.value, status=body.status.value,
        cover_image_url=body.cover_image_url,
        author_name=body.author_name,
        scheduled_at=body.scheduled_at,
        published_at=_now() if body.status == ContentStatus.PUBLISHED else None,
        created_at=_now(), updated_at=_now(),
    )
    db.add(post)

    for locale, tin in body.translations.items():
        await _check_slug_unique(db, locale, tin.slug)
        db.add(ContentPostTranslation(
            id=str(uuid.uuid4()), content_post_id=post.id, locale=locale,
            title=tin.title, slug=tin.slug, excerpt=tin.excerpt,
            body_markdown=tin.body_markdown,
            meta_title=tin.meta_title, meta_description=tin.meta_description,
            og_title=tin.og_title, og_description=tin.og_description,
            og_image_url=tin.og_image_url,
            created_at=_now(), updated_at=_now(),
        ))

    await db.commit()
    return await admin_get_content(db, post.id)


async def update_content(
    db: AsyncSession, content_id: str, body: ContentUpdateRequest
) -> ContentAdminItem:
    result = await db.execute(
        select(ContentPost)
        .where(ContentPost.id == content_id)
        .options(selectinload(ContentPost.translations))
    )
    post = result.scalar_one_or_none()
    if not post:
        raise not_found("Content")

    if body.status is not None:
        _validate_status_transition(post, body)
        if body.status == ContentStatus.PUBLISHED and not post.published_at:
            post.published_at = _now()
        post.status = body.status.value
        post.updated_at = _now()

    if body.cover_image_url is not None:
        post.cover_image_url = body.cover_image_url
        post.updated_at = _now()
    if body.author_name is not None:
        post.author_name = body.author_name
        post.updated_at = _now()
    if body.scheduled_at is not None:
        post.scheduled_at = body.scheduled_at
        post.updated_at = _now()

    if body.translations:
        for locale, tin in body.translations.items():
            existing_t = next((t for t in post.translations if t.locale == locale), None)
            if existing_t:
                if existing_t.slug != tin.slug:
                    await _check_slug_unique(db, locale, tin.slug)
                existing_t.title = tin.title
                existing_t.slug = tin.slug
                existing_t.excerpt = tin.excerpt
                existing_t.body_markdown = tin.body_markdown
                existing_t.meta_title = tin.meta_title
                existing_t.meta_description = tin.meta_description
                existing_t.og_title = tin.og_title
                existing_t.og_description = tin.og_description
                existing_t.og_image_url = tin.og_image_url
                existing_t.updated_at = _now()
            else:
                await _check_slug_unique(db, locale, tin.slug)
                db.add(ContentPostTranslation(
                    id=str(uuid.uuid4()), content_post_id=post.id, locale=locale,
                    title=tin.title, slug=tin.slug, excerpt=tin.excerpt,
                    body_markdown=tin.body_markdown,
                    meta_title=tin.meta_title, meta_description=tin.meta_description,
                    og_title=tin.og_title, og_description=tin.og_description,
                    og_image_url=tin.og_image_url,
                    created_at=_now(), updated_at=_now(),
                ))

    await db.commit()
    return await admin_get_content(db, content_id)


async def delete_content(db: AsyncSession, content_id: str) -> None:
    post = (await db.execute(select(ContentPost).where(ContentPost.id == content_id))).scalar_one_or_none()
    if not post:
        raise not_found("Content")
    await db.execute(delete(ContentPostProduct).where(ContentPostProduct.content_post_id == content_id))
    await db.execute(delete(ContentPostCategory).where(ContentPostCategory.content_post_id == content_id))
    await db.execute(delete(ContentPostTranslation).where(ContentPostTranslation.content_post_id == content_id))
    await db.execute(delete(ContentPost).where(ContentPost.id == content_id))
    await db.commit()


async def link_product(
    db: AsyncSession, content_id: str, body: ContentProductLinkRequest
) -> None:
    post = (await db.execute(select(ContentPost).where(ContentPost.id == content_id))).scalar_one_or_none()
    if not post:
        raise not_found("Content")
    product = (await db.execute(select(Product).where(Product.id == body.product_id))).scalar_one_or_none()
    if not product:
        raise not_found("Product")
    existing = await db.execute(
        select(ContentPostProduct).where(
            ContentPostProduct.content_post_id == content_id,
            ContentPostProduct.product_id == body.product_id,
        )
    )
    if existing.scalar_one_or_none():
        raise conflict("ALREADY_LINKED", "Product already linked to this content.")
    db.add(ContentPostProduct(
        content_post_id=content_id, product_id=body.product_id,
        sort_order=body.sort_order, created_at=_now(),
    ))
    await db.commit()


async def unlink_product(db: AsyncSession, content_id: str, product_id: str) -> None:
    result = await db.execute(
        select(ContentPostProduct).where(
            ContentPostProduct.content_post_id == content_id,
            ContentPostProduct.product_id == product_id,
        )
    )
    link = result.scalar_one_or_none()
    if not link:
        raise not_found("Product link")
    await db.delete(link)
    await db.commit()


async def link_category(
    db: AsyncSession, content_id: str, body: ContentCategoryLinkRequest
) -> None:
    post = (await db.execute(select(ContentPost).where(ContentPost.id == content_id))).scalar_one_or_none()
    if not post:
        raise not_found("Content")
    category = (await db.execute(
        select(RoomCategory).where(RoomCategory.id == body.category_id)
    )).scalar_one_or_none()
    if not category:
        raise not_found("Category")
    existing = await db.execute(
        select(ContentPostCategory).where(
            ContentPostCategory.content_post_id == content_id,
            ContentPostCategory.room_category_id == body.category_id,
        )
    )
    if existing.scalar_one_or_none():
        raise conflict("ALREADY_LINKED", "Category already linked to this content.")
    db.add(ContentPostCategory(
        content_post_id=content_id,
        room_category_id=body.category_id,
        created_at=_now(),
    ))
    await db.commit()


async def unlink_category(db: AsyncSession, content_id: str, category_id: str) -> None:
    result = await db.execute(
        select(ContentPostCategory).where(
            ContentPostCategory.content_post_id == content_id,
            ContentPostCategory.room_category_id == category_id,
        )
    )
    link = result.scalar_one_or_none()
    if not link:
        raise not_found("Category link")
    await db.delete(link)
    await db.commit()


# ── Private helpers ──────────────────────────────────────────────────────────

async def _check_slug_unique(db: AsyncSession, locale: str, slug: str) -> None:
    existing = await db.execute(
        select(ContentPostTranslation).where(
            ContentPostTranslation.locale == locale,
            ContentPostTranslation.slug == slug,
        )
    )
    if existing.scalar_one_or_none():
        raise conflict("DUPLICATE_SLUG", f"Slug '{slug}' already used for locale '{locale}'.")


def _validate_status_transition(post: ContentPost, body: ContentUpdateRequest) -> None:
    now = _now()
    if body.status == ContentStatus.PUBLISHED:
        vi_trans = next((t for t in post.translations if t.locale == "vi"), None)
        if not vi_trans:
            raise validation_error("Vietnamese translation is required before publishing.")
        if not post.cover_image_url and body.cover_image_url is None:
            raise validation_error("cover_image_url is required for published content.")
    if body.status == ContentStatus.SCHEDULED:
        scheduled = body.scheduled_at or post.scheduled_at
        if not scheduled:
            raise validation_error("scheduled_at is required when status is SCHEDULED.")
        if scheduled <= now:
            raise validation_error("scheduled_at must be in the future.")


async def _load_linked_products(
    db: AsyncSession, post: ContentPost, locale: str
) -> list:
    items = []
    for cpp in sorted(post.product_links, key=lambda x: x.sort_order):
        row = (await db.execute(
            select(Product, ProductTranslation)
            .join(
                ProductTranslation,
                (ProductTranslation.product_id == Product.id) & (ProductTranslation.locale == locale),
                isouter=True,
            )
            .where(Product.id == cpp.product_id, Product.status == ProductStatus.ACTIVE)
        )).first()
        if not row:
            continue
        p, pt = row
        if pt is None:
            pt_vi = (await db.execute(
                select(ProductTranslation).where(
                    ProductTranslation.product_id == p.id, ProductTranslation.locale == "vi"
                )
            )).scalar_one_or_none()
            pt = pt_vi
        if not pt:
            continue
        items.append(LinkedProductItem(
            id=p.id, name=pt.name, slug=pt.slug,
            primary_image_url=p.primary_image_url, base_price_vnd=p.base_price_vnd,
        ))
    return items


async def _load_linked_categories(
    db: AsyncSession, post: ContentPost, locale: str
) -> list:
    items = []
    for cpc in post.category_links:
        row = (await db.execute(
            select(RoomCategory, RoomCategoryTranslation)
            .join(
                RoomCategoryTranslation,
                (RoomCategoryTranslation.category_id == RoomCategory.id) & (RoomCategoryTranslation.locale == locale),
                isouter=True,
            )
            .where(RoomCategory.id == cpc.room_category_id)
        )).first()
        if not row:
            continue
        cat, ct = row
        if ct is None:
            ct_vi = (await db.execute(
                select(RoomCategoryTranslation).where(
                    RoomCategoryTranslation.category_id == cat.id, RoomCategoryTranslation.locale == "vi"
                )
            )).scalar_one_or_none()
            ct = ct_vi
        if not ct:
            continue
        items.append(LinkedCategoryItem(code=cat.code, name=ct.name, slug=ct.slug))
    return items


async def _load_related_guides(
    db: AsyncSession, post: ContentPost, locale: str, limit: int = 3
) -> list:
    now = _now()
    result = await db.execute(
        select(ContentPost)
        .where(
            ContentPost.id != post.id,
            ContentPost.type == post.type,
            ContentPost.status == ContentStatus.PUBLISHED,
            ContentPost.published_at <= now,
        )
        .options(selectinload(ContentPost.translations))
        .order_by(ContentPost.published_at.desc())
        .limit(limit)
    )
    related = result.scalars().all()
    items = []
    for r in related:
        t = _get_translation(r.translations, locale)
        if not t:
            continue
        items.append(RelatedGuideItem(
            id=r.id, type=r.type,
            title=t.title, slug=t.slug, excerpt=t.excerpt,
            cover_image_url=r.cover_image_url, published_at=r.published_at,
        ))
    return items
