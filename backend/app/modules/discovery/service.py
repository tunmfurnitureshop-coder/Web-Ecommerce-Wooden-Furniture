import uuid
from datetime import datetime, timezone
from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from sqlalchemy.orm import selectinload

from app.modules.product.models import Product, ProductTranslation, RoomCategory, RoomCategoryTranslation
from app.modules.taxonomy.models import Tag, TagTranslation, ProductTag
from app.modules.discovery.models import ProductRelation, SearchSynonym
from app.modules.discovery.schemas import (
    RecentlyViewedHydrateRequest, RecentlyViewedItem,
    RelatedProductItem, CategoryLandingOut, MaterialLandingOut,
    SeoOut, BreadcrumbItem, TagInfo, CategoryProductItem, FeaturedCollectionItem,
    SynonymCreateRequest, SynonymUpdateRequest, SynonymOut, SynonymListResponse,
)
from app.core.exceptions import not_found, conflict
from app.shared.enums import ProductStatus, CollectionStatus, ContentStatus, ProductRelationType


def _now():
    return datetime.now(timezone.utc)


def _get_trans(translations, locale: str, fallback: str = "vi"):
    for t in translations:
        if t.locale == locale:
            return t
    for t in translations:
        if t.locale == fallback:
            return t
    return translations[0] if translations else None


async def expand_query(db: AsyncSession, q: str, locale: str) -> List[str]:
    normalized = q.strip().lower()
    result = await db.execute(
        select(SearchSynonym).where(
            SearchSynonym.locale == locale,
            SearchSynonym.synonym_term == normalized,
        )
    )
    syn = result.scalar_one_or_none()
    if syn:
        return list({normalized, syn.canonical_term.lower()})
    return [normalized]


async def hydrate_recently_viewed(
    db: AsyncSession, body: RecentlyViewedHydrateRequest
) -> List[RecentlyViewedItem]:
    if not body.productIds:
        return []

    rows = await db.execute(
        select(Product, ProductTranslation)
        .join(
            ProductTranslation,
            and_(
                ProductTranslation.product_id == Product.id,
                ProductTranslation.locale == body.locale,
            ),
            isouter=True,
        )
        .where(Product.id.in_(body.productIds), Product.status == ProductStatus.ACTIVE)
    )
    product_map = {p.id: (p, pt) for p, pt in rows.all() if p is not None}

    items = []
    for pid in body.productIds:
        if pid not in product_map:
            continue
        p, pt = product_map[pid]
        if pt is None:
            continue
        items.append(RecentlyViewedItem(
            id=p.id, name=pt.name, slug=pt.slug,
            basePriceVnd=p.base_price_vnd, primaryImageUrl=p.primary_image_url,
        ))
    return items


async def get_related_products(
    db: AsyncSession, product_id: str, locale: str = "vi", limit: int = 8
) -> List[RelatedProductItem]:
    product = (await db.execute(
        select(Product).where(Product.id == product_id)
    )).scalar_one_or_none()
    if not product:
        raise not_found("Product")

    items: List[RelatedProductItem] = []
    seen: set = {product_id}

    async def _to_item(p: Product, source: str) -> Optional[RelatedProductItem]:
        if p.id in seen or p.status != ProductStatus.ACTIVE:
            return None
        pt = (await db.execute(
            select(ProductTranslation).where(
                ProductTranslation.product_id == p.id, ProductTranslation.locale == locale
            )
        )).scalar_one_or_none()
        if not pt:
            pt = (await db.execute(
                select(ProductTranslation).where(
                    ProductTranslation.product_id == p.id, ProductTranslation.locale == "vi"
                )
            )).scalar_one_or_none()
        if not pt:
            return None
        seen.add(p.id)
        return RelatedProductItem(
            id=p.id, name=pt.name, slug=pt.slug,
            basePriceVnd=p.base_price_vnd, primaryImageUrl=p.primary_image_url,
            relationSource=source,
        )

    # 1. Manual relations
    manual_rows = (await db.execute(
        select(ProductRelation)
        .where(
            ProductRelation.source_product_id == product_id,
            ProductRelation.relation_type == ProductRelationType.MANUAL_RELATED,
        )
        .order_by(ProductRelation.sort_order)
    )).scalars().all()

    for rel in manual_rows:
        if len(items) >= limit:
            break
        p = (await db.execute(select(Product).where(Product.id == rel.target_product_id))).scalar_one_or_none()
        if p:
            item = await _to_item(p, "manual")
            if item:
                items.append(item)

    if len(items) >= limit:
        return items[:limit]

    # 2. Same category
    cat_rows = (await db.execute(
        select(Product)
        .where(
            Product.room_category_id == product.room_category_id,
            Product.id != product_id,
            Product.status == ProductStatus.ACTIVE,
        )
        .limit(limit)
    )).scalars().all()
    for p in cat_rows:
        if len(items) >= limit:
            break
        item = await _to_item(p, "category")
        if item:
            items.append(item)

    if len(items) >= limit:
        return items[:limit]

    # 3. Shared tags
    tag_ids_result = await db.execute(
        select(ProductTag.tag_id).where(ProductTag.product_id == product_id)
    )
    tag_ids = [r[0] for r in tag_ids_result.all()]
    if tag_ids:
        shared_tag_product_ids = (await db.execute(
            select(ProductTag.product_id)
            .where(ProductTag.tag_id.in_(tag_ids), ProductTag.product_id != product_id)
        )).scalars().all()
        for pid in shared_tag_product_ids:
            if len(items) >= limit:
                break
            if pid in seen:
                continue
            p = (await db.execute(select(Product).where(Product.id == pid))).scalar_one_or_none()
            if p:
                item = await _to_item(p, "tags")
                if item:
                    items.append(item)

    if len(items) >= limit:
        return items[:limit]

    # 4. Same price tier tag
    price_tier_tag = (await db.execute(
        select(Tag)
        .join(ProductTag, ProductTag.tag_id == Tag.id)
        .where(ProductTag.product_id == product_id, Tag.type == "PRICE_TIER")
    )).scalar_one_or_none()
    if price_tier_tag:
        tier_product_ids = (await db.execute(
            select(ProductTag.product_id)
            .where(ProductTag.tag_id == price_tier_tag.id, ProductTag.product_id != product_id)
        )).scalars().all()
        for pid in tier_product_ids:
            if len(items) >= limit:
                break
            if pid in seen:
                continue
            p = (await db.execute(select(Product).where(Product.id == pid))).scalar_one_or_none()
            if p:
                item = await _to_item(p, "price_tier")
                if item:
                    items.append(item)

    if len(items) >= limit:
        return items[:limit]

    # 5. Latest active products
    latest = (await db.execute(
        select(Product)
        .where(Product.status == ProductStatus.ACTIVE, Product.id.notin_(seen))
        .order_by(Product.created_at.desc())
        .limit(limit - len(items))
    )).scalars().all()
    for p in latest:
        if len(items) >= limit:
            break
        item = await _to_item(p, "latest")
        if item:
            items.append(item)

    return items[:limit]


async def get_category_landing(
    db: AsyncSession, slug: str, locale: str = "vi"
) -> CategoryLandingOut:
    from app.modules.collection.models import Collection, CollectionTranslation

    cat_trans = (await db.execute(
        select(RoomCategoryTranslation).where(
            RoomCategoryTranslation.slug == slug,
            RoomCategoryTranslation.locale == locale,
        )
    )).scalar_one_or_none()
    if not cat_trans:
        cat_trans = (await db.execute(
            select(RoomCategoryTranslation).where(RoomCategoryTranslation.slug == slug)
        )).scalar_one_or_none()
    if not cat_trans:
        raise not_found("Category")

    cat = (await db.execute(
        select(RoomCategory)
        .where(RoomCategory.id == cat_trans.category_id, RoomCategory.is_active == True)  # noqa: E712
        .options(selectinload(RoomCategory.translations))
    )).scalar_one_or_none()
    if not cat:
        raise not_found("Category")

    display_trans = _get_trans(cat.translations, locale)

    seo = SeoOut(
        meta_title=display_trans.meta_title or display_trans.name,
        meta_description=display_trans.meta_description or display_trans.description,
        og_title=display_trans.og_title or display_trans.meta_title or display_trans.name,
        og_description=display_trans.og_description or display_trans.meta_description,
        og_image_url=display_trans.og_image_url,
    )
    breadcrumbs = [
        BreadcrumbItem(name="Trang chủ" if locale == "vi" else "首页", href=f"/{locale}"),
        BreadcrumbItem(name=display_trans.name, href=f"/{locale}/room/{display_trans.slug}"),
    ]

    product_rows = (await db.execute(
        select(Product, ProductTranslation)
        .join(
            ProductTranslation,
            and_(
                ProductTranslation.product_id == Product.id,
                ProductTranslation.locale == locale,
            ),
            isouter=True,
        )
        .where(Product.room_category_id == cat.id, Product.status == ProductStatus.ACTIVE)
        .order_by(Product.created_at.desc())
        .limit(8)
    )).all()
    featured_products = [
        CategoryProductItem(
            id=p.id, name=pt.name, slug=pt.slug,
            basePriceVnd=p.base_price_vnd, primaryImageUrl=p.primary_image_url,
        )
        for p, pt in product_rows if pt is not None
    ]

    tag_rows = (await db.execute(
        select(Tag)
        .join(ProductTag, ProductTag.tag_id == Tag.id)
        .join(Product, Product.id == ProductTag.product_id)
        .where(Product.room_category_id == cat.id, Product.status == ProductStatus.ACTIVE, Tag.is_active == True)  # noqa: E712
        .options(selectinload(Tag.translations))
        .distinct()
    )).scalars().all()
    available_tags = []
    for tag in tag_rows:
        t = _get_trans(tag.translations, locale)
        if t:
            available_tags.append(TagInfo(code=tag.code, type=tag.type, name=t.name, slug=t.slug))

    col_rows = (await db.execute(
        select(Collection, CollectionTranslation)
        .join(
            CollectionTranslation,
            and_(
                CollectionTranslation.collection_id == Collection.id,
                CollectionTranslation.locale == locale,
            ),
            isouter=True,
        )
        .where(Collection.status == CollectionStatus.PUBLISHED)
        .order_by(Collection.sort_order)
        .limit(4)
    )).all()
    featured_collections = [
        FeaturedCollectionItem(id=c.id, name=ct.name, slug=ct.slug, cover_image_url=c.cover_image_url)
        for c, ct in col_rows if ct is not None
    ]

    return CategoryLandingOut(
        code=cat.code, name=display_trans.name, slug=display_trans.slug,
        description=display_trans.description,
        seo=seo, breadcrumbs=breadcrumbs,
        featured_products=featured_products, available_tags=available_tags,
        featured_collections=featured_collections,
    )


async def get_material_landing(
    db: AsyncSession, slug: str, locale: str = "vi"
) -> MaterialLandingOut:
    from app.modules.content.models import ContentPost, ContentPostTranslation

    tag_trans = (await db.execute(
        select(TagTranslation).where(
            TagTranslation.slug == slug, TagTranslation.locale == locale
        )
    )).scalar_one_or_none()
    if not tag_trans:
        tag_trans = (await db.execute(
            select(TagTranslation).where(TagTranslation.slug == slug)
        )).scalar_one_or_none()
    if not tag_trans:
        raise not_found("Material")

    tag = (await db.execute(
        select(Tag).where(Tag.id == tag_trans.tag_id, Tag.type == "MATERIAL", Tag.is_active == True)  # noqa: E712
        .options(selectinload(Tag.translations))
    )).scalar_one_or_none()
    if not tag:
        raise not_found("Material")

    display_trans = _get_trans(tag.translations, locale)

    seo = SeoOut(
        meta_title=display_trans.name,
        og_title=display_trans.name,
    )
    breadcrumbs = [
        BreadcrumbItem(name="Trang chủ" if locale == "vi" else "首页", href=f"/{locale}"),
        BreadcrumbItem(name=display_trans.name, href=f"/{locale}/material/{display_trans.slug}"),
    ]

    product_rows = (await db.execute(
        select(Product, ProductTranslation)
        .join(ProductTag, ProductTag.product_id == Product.id)
        .join(
            ProductTranslation,
            and_(
                ProductTranslation.product_id == Product.id,
                ProductTranslation.locale == locale,
            ),
            isouter=True,
        )
        .where(
            ProductTag.tag_id == tag.id,
            Product.status == ProductStatus.ACTIVE,
        )
        .order_by(Product.created_at.desc())
        .limit(12)
    )).all()
    products = [
        CategoryProductItem(
            id=p.id, name=pt.name, slug=pt.slug,
            basePriceVnd=p.base_price_vnd, primaryImageUrl=p.primary_image_url,
        )
        for p, pt in product_rows if pt is not None
    ]

    now = _now()
    guide_rows = (await db.execute(
        select(ContentPost, ContentPostTranslation)
        .join(
            ContentPostTranslation,
            and_(
                ContentPostTranslation.content_post_id == ContentPost.id,
                ContentPostTranslation.locale == locale,
            ),
            isouter=True,
        )
        .where(ContentPost.status == ContentStatus.PUBLISHED, ContentPost.published_at <= now)
        .order_by(ContentPost.published_at.desc())
        .limit(3)
    )).all()
    related_guides = [
        {"id": g.id, "type": g.type, "title": gt.title, "slug": gt.slug, "cover_image_url": g.cover_image_url}
        for g, gt in guide_rows if gt is not None
    ]

    return MaterialLandingOut(
        code=tag.code, name=display_trans.name, slug=display_trans.slug,
        description=display_trans.description,
        seo=seo, breadcrumbs=breadcrumbs,
        products=products, related_guides=related_guides,
    )


# ── Search Synonyms Admin ────────────────────────────────────────────────────

async def admin_list_synonyms(db: AsyncSession) -> SynonymListResponse:
    rows = (await db.execute(
        select(SearchSynonym).order_by(SearchSynonym.locale, SearchSynonym.canonical_term)
    )).scalars().all()
    return SynonymListResponse(items=[
        SynonymOut(id=r.id, locale=r.locale, canonical_term=r.canonical_term, synonym_term=r.synonym_term)
        for r in rows
    ])


async def admin_create_synonym(db: AsyncSession, body: SynonymCreateRequest) -> SynonymOut:
    existing = (await db.execute(
        select(SearchSynonym).where(
            SearchSynonym.locale == body.locale, SearchSynonym.synonym_term == body.synonym_term
        )
    )).scalar_one_or_none()
    if existing:
        raise conflict("DUPLICATE_SYNONYM", f"Synonym '{body.synonym_term}' already exists for locale '{body.locale}'.")
    s = SearchSynonym(
        id=str(uuid.uuid4()),
        locale=body.locale, canonical_term=body.canonical_term, synonym_term=body.synonym_term,
        created_at=_now(), updated_at=_now(),
    )
    db.add(s)
    await db.commit()
    return SynonymOut(id=s.id, locale=s.locale, canonical_term=s.canonical_term, synonym_term=s.synonym_term)


async def admin_update_synonym(
    db: AsyncSession, synonym_id: str, body: SynonymUpdateRequest
) -> SynonymOut:
    s = (await db.execute(
        select(SearchSynonym).where(SearchSynonym.id == synonym_id)
    )).scalar_one_or_none()
    if not s:
        raise not_found("Synonym")
    if body.canonical_term is not None:
        s.canonical_term = body.canonical_term
    if body.synonym_term is not None:
        s.synonym_term = body.synonym_term
    s.updated_at = _now()
    await db.commit()
    return SynonymOut(id=s.id, locale=s.locale, canonical_term=s.canonical_term, synonym_term=s.synonym_term)


async def admin_delete_synonym(db: AsyncSession, synonym_id: str) -> None:
    s = (await db.execute(
        select(SearchSynonym).where(SearchSynonym.id == synonym_id)
    )).scalar_one_or_none()
    if not s:
        raise not_found("Synonym")
    await db.delete(s)
    await db.commit()
