from fastapi import APIRouter, Depends, Query
from typing import Optional
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
    room: Optional[str] = Query(None),
    woodType: Optional[str] = Query(None),
    minPrice: Optional[int] = Query(None),
    maxPrice: Optional[int] = Query(None),
    page: int = Query(1, ge=1),
    pageSize: int = Query(12, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    return await service.get_catalog(db, locale, room, woodType, minPrice, maxPrice, page, pageSize)


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
