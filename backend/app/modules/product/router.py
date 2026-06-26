from fastapi import APIRouter, Depends, Query
from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.modules.product import service
from app.modules.product.schemas import (
    ProductCatalogResponse, ProductDetailOut,
    CreateProductRequest, UpdateProductRequest,
    AdminProductListResponse, AdminProductItem
)
from app.modules.auth.dependencies import require_admin
from app.modules.discovery.schemas import BestSellerListResponse
from app.modules.promotion.schemas import DealListResponse
from app.modules.campaign import service as campaign_service
from app.shared.enums import CampaignTargetType

router = APIRouter(tags=["products"])
admin_router = APIRouter(tags=["admin-products"])


@router.get("/products", response_model=ProductCatalogResponse)
async def list_products(
    locale: str = Query("vi"),
    q: Optional[str] = Query(None),
    room: Optional[str] = Query(None),
    woodType: Optional[str] = Query(None),
    minPrice: Optional[int] = Query(None),
    maxPrice: Optional[int] = Query(None),
    sort: str = Query("newest"),
    page: int = Query(1, ge=1),
    pageSize: int = Query(12, ge=1, le=100),
    tags: Optional[str] = Query(None, description="Comma-separated tag codes"),
    availability: Optional[str] = Query(None),
    ratingMin: Optional[float] = Query(None, ge=1.0, le=5.0),
    campaign: Optional[str] = Query(None, description="Campaign slug — scopes the catalog to the campaign target"),
    db: AsyncSession = Depends(get_db),
):
    tag_list = [t.strip() for t in tags.split(",") if t.strip()] if tags else None

    # Campaign scoping: resolve the target to concrete ids; ignore unknown/inactive
    # slugs (graceful — show the full catalog rather than 404 on a PLP).
    collection_id = room_category_id = None
    banner = None
    if campaign:
        camp = await campaign_service.resolve_active_campaign_by_slug(db, campaign, locale)
        if camp and camp.target_type and camp.target_id:
            if camp.target_type == CampaignTargetType.COLLECTION:
                collection_id = camp.target_id
            elif camp.target_type == CampaignTargetType.CATEGORY:
                room_category_id = camp.target_id
            banner = await campaign_service.build_campaign_banner(db, camp, locale)

    result = await service.get_catalog(
        db, locale, q, room, woodType, minPrice, maxPrice, sort, page, pageSize,
        tags=tag_list, availability=availability, rating_min=ratingMin,
        collection_id=collection_id, room_category_id=room_category_id,
    )
    result.campaignBanner = banner
    return result


@router.get("/products/suggestions")
async def suggestions(
    q: str = Query(""),
    locale: str = Query("vi"),
    db: AsyncSession = Depends(get_db),
):
    if len(q) < 2:
        return {"products": [], "categories": [], "woodTypes": [], "collections": [], "tags": []}
    return await service.get_suggestions(db, q, locale)


# NOTE: literal paths must precede the "/products/{slug}" catch-all below,
# otherwise "best-sellers"/"deals" get captured as a slug.
@router.get("/products/best-sellers", response_model=BestSellerListResponse)
async def best_sellers(
    locale: str = Query("vi"),
    limit: int = Query(12, ge=1, le=24),
    db: AsyncSession = Depends(get_db),
):
    from app.modules.discovery.best_sellers_service import get_best_sellers
    return await get_best_sellers(db, locale, limit)


@router.get("/products/deals", response_model=DealListResponse)
async def deals(
    locale: str = Query("vi"),
    limit: int = Query(12, ge=1, le=24),
    db: AsyncSession = Depends(get_db),
):
    from app.modules.promotion.deals_service import get_active_deals
    return await get_active_deals(db, locale, limit)


@router.get("/products/{slug}/related")
async def get_related_products(
    slug: str,
    locale: str = Query("vi"),
    limit: int = Query(8, ge=1, le=20),
    db: AsyncSession = Depends(get_db),
):
    from app.modules.product.models import ProductTranslation
    from sqlalchemy import select
    trans = (await db.execute(
        select(ProductTranslation).where(
            ProductTranslation.slug == slug, ProductTranslation.locale == locale
        )
    )).scalar_one_or_none()
    if not trans:
        trans = (await db.execute(
            select(ProductTranslation).where(ProductTranslation.slug == slug)
        )).scalar_one_or_none()
    if not trans:
        from app.core.exceptions import not_found
        raise not_found("Product")
    from app.modules.discovery.service import get_related_products
    items = await get_related_products(db, trans.product_id, locale, limit)
    return {"items": [i.model_dump() for i in items]}


@router.get("/products/{slug}", response_model=ProductDetailOut)
async def get_product(slug: str, locale: str = Query("vi"), db: AsyncSession = Depends(get_db)):
    return await service.get_product_detail(db, slug, locale)


@admin_router.get("/products", response_model=AdminProductListResponse)
async def admin_list_products(
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(require_admin),
):
    return await service.admin_list_products(db)


@admin_router.get("/products/{product_id}", response_model=AdminProductItem)
async def admin_get_product(
    product_id: str,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(require_admin),
):
    return await service.admin_get_product(db, product_id)


@admin_router.post("/products")
async def admin_create_product(
    body: CreateProductRequest,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(require_admin),
):
    return await service.create_product(db, body)


@admin_router.patch("/products/{product_id}")
async def admin_update_product(
    product_id: str,
    body: UpdateProductRequest,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(require_admin),
):
    return await service.update_product(db, product_id, body)
