from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.modules.collection import service
from app.modules.collection.schemas import (
    CollectionCreateRequest, CollectionUpdateRequest,
    CollectionProductAddRequest, CollectionProductReorderRequest,
    CollectionListResponse, CollectionDetailOut,
    CollectionAdminItem, CollectionAdminListResponse,
)
from app.modules.auth.dependencies import require_admin

router = APIRouter(tags=["collections"])
admin_router = APIRouter(tags=["admin-collections"])


@router.get("/collections", response_model=CollectionListResponse)
async def list_collections(
    locale: str = Query("vi"),
    featured: bool = Query(False),
    db: AsyncSession = Depends(get_db),
):
    return await service.list_public_collections(db, locale, featured)


@router.get("/collections/{slug}", response_model=CollectionDetailOut)
async def get_collection(
    slug: str,
    locale: str = Query("vi"),
    db: AsyncSession = Depends(get_db),
):
    return await service.get_collection_by_slug(db, slug, locale)


@admin_router.get("/collections", response_model=CollectionAdminListResponse)
async def admin_list_collections(
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(require_admin),
):
    return await service.admin_list_collections(db)


@admin_router.post("/collections", response_model=CollectionAdminItem, status_code=201)
async def admin_create_collection(
    body: CollectionCreateRequest,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(require_admin),
):
    return await service.create_collection(db, body)


@admin_router.get("/collections/{collection_id}", response_model=CollectionAdminItem)
async def admin_get_collection(
    collection_id: str,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(require_admin),
):
    return await service.admin_get_collection(db, collection_id)


@admin_router.patch("/collections/{collection_id}", response_model=CollectionAdminItem)
async def admin_update_collection(
    collection_id: str,
    body: CollectionUpdateRequest,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(require_admin),
):
    return await service.update_collection(db, collection_id, body)


@admin_router.delete("/collections/{collection_id}", status_code=204)
async def admin_delete_collection(
    collection_id: str,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(require_admin),
):
    await service.delete_collection(db, collection_id)


@admin_router.post("/collections/{collection_id}/products", status_code=201)
async def admin_add_product(
    collection_id: str,
    body: CollectionProductAddRequest,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(require_admin),
):
    await service.add_product_to_collection(db, collection_id, body)
    return {"ok": True}


@admin_router.patch("/collections/{collection_id}/products/reorder")
async def admin_reorder_products(
    collection_id: str,
    body: CollectionProductReorderRequest,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(require_admin),
):
    await service.reorder_collection_products(db, collection_id, body)
    return {"ok": True}


@admin_router.delete("/collections/{collection_id}/products/{product_id}", status_code=204)
async def admin_remove_product(
    collection_id: str,
    product_id: str,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(require_admin),
):
    await service.remove_product_from_collection(db, collection_id, product_id)
