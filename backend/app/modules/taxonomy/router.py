from fastapi import APIRouter, Depends, Query
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.modules.taxonomy import service
from app.modules.taxonomy.schemas import (
    TagCreateRequest, TagUpdateRequest,
    TagListResponse, TagAdminOut, TagAdminListResponse,
)
from app.modules.auth.dependencies import require_admin

router = APIRouter(tags=["taxonomy"])
admin_router = APIRouter(tags=["admin-taxonomy"])


@router.get("/tags", response_model=TagListResponse)
async def list_tags(
    locale: str = Query("vi"),
    type: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    return await service.get_public_tags(db, locale, type)


@admin_router.get("/tags", response_model=TagAdminListResponse)
async def admin_list_tags(
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(require_admin),
):
    return await service.admin_list_tags(db)


@admin_router.post("/tags", response_model=TagAdminOut, status_code=201)
async def admin_create_tag(
    body: TagCreateRequest,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(require_admin),
):
    return await service.create_tag(db, body)


@admin_router.patch("/tags/{tag_id}", response_model=TagAdminOut)
async def admin_update_tag(
    tag_id: str,
    body: TagUpdateRequest,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(require_admin),
):
    return await service.update_tag(db, tag_id, body)


@admin_router.delete("/tags/{tag_id}", status_code=204)
async def admin_delete_tag(
    tag_id: str,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(require_admin),
):
    await service.delete_tag(db, tag_id)
