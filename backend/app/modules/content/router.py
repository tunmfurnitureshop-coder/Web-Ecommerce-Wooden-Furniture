from fastapi import APIRouter, Depends, Query
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.modules.content import service
from app.modules.content.schemas import (
    ContentCreateRequest, ContentUpdateRequest,
    ContentProductLinkRequest, ContentCategoryLinkRequest,
    ContentListResponse, ContentDetailOut,
    ContentAdminItem, ContentAdminListResponse,
)
from app.modules.auth.dependencies import require_admin

router = APIRouter(tags=["guides"])
admin_router = APIRouter(tags=["admin-content"])


@router.get("/guides", response_model=ContentListResponse)
async def list_guides(
    locale: str = Query("vi"),
    type: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    pageSize: int = Query(12, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
):
    return await service.list_public_content(db, locale, type, page, pageSize)


@router.get("/guides/{slug}", response_model=ContentDetailOut)
async def get_guide(
    slug: str,
    locale: str = Query("vi"),
    db: AsyncSession = Depends(get_db),
):
    return await service.get_public_content_by_slug(db, slug, locale)


@admin_router.get("/content", response_model=ContentAdminListResponse)
async def admin_list_content(
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(require_admin),
):
    return await service.admin_list_content(db)


@admin_router.post("/content", response_model=ContentAdminItem, status_code=201)
async def admin_create_content(
    body: ContentCreateRequest,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(require_admin),
):
    return await service.create_content(db, body)


@admin_router.get("/content/{content_id}", response_model=ContentAdminItem)
async def admin_get_content(
    content_id: str,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(require_admin),
):
    return await service.admin_get_content(db, content_id)


@admin_router.patch("/content/{content_id}", response_model=ContentAdminItem)
async def admin_update_content(
    content_id: str,
    body: ContentUpdateRequest,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(require_admin),
):
    return await service.update_content(db, content_id, body)


@admin_router.delete("/content/{content_id}", status_code=204)
async def admin_delete_content(
    content_id: str,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(require_admin),
):
    await service.delete_content(db, content_id)


@admin_router.post("/content/{content_id}/products", status_code=201)
async def admin_link_product(
    content_id: str,
    body: ContentProductLinkRequest,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(require_admin),
):
    await service.link_product(db, content_id, body)
    return {"ok": True}


@admin_router.delete("/content/{content_id}/products/{product_id}", status_code=204)
async def admin_unlink_product(
    content_id: str,
    product_id: str,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(require_admin),
):
    await service.unlink_product(db, content_id, product_id)


@admin_router.post("/content/{content_id}/categories", status_code=201)
async def admin_link_category(
    content_id: str,
    body: ContentCategoryLinkRequest,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(require_admin),
):
    await service.link_category(db, content_id, body)
    return {"ok": True}


@admin_router.delete("/content/{content_id}/categories/{category_id}", status_code=204)
async def admin_unlink_category(
    content_id: str,
    category_id: str,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(require_admin),
):
    await service.unlink_category(db, content_id, category_id)
