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
    db: AsyncSession = Depends(get_db),
):
    tag_list = [t.strip() for t in tags.split(",") if t.strip()] if tags else None
    return await service.get_catalog(
        db, locale, q, room, woodType, minPrice, maxPrice, sort, page, pageSize,
        tags=tag_list, availability=availability, rating_min=ratingMin,
    )


@router.get("/products/suggestions")
async def suggestions(
    q: str = Query(""),
    locale: str = Query("vi"),
    db: AsyncSession = Depends(get_db),
):
    if len(q) < 2:
        return {"products": [], "categories": [], "woodTypes": [], "collections": [], "tags": []}
    return await service.get_suggestions(db, q, locale)


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
