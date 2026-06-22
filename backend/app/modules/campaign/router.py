from fastapi import APIRouter, Depends, Query
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.modules.campaign import service
from app.modules.campaign.schemas import (
    CampaignListResponse, CampaignDetailResponse,
    AdminCreateCampaignRequest, AdminPatchCampaignRequest,
)
from app.modules.auth.dependencies import require_admin

router = APIRouter(tags=["campaigns"])
admin_router = APIRouter(tags=["admin-campaigns"])


@router.get("/campaigns", response_model=CampaignListResponse)
async def list_campaigns(
    locale: str = Query("vi"),
    placement: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    return await service.get_active_campaigns(db, locale=locale, placement=placement)


@router.get("/campaigns/{slug}", response_model=CampaignDetailResponse)
async def campaign_detail(
    slug: str,
    locale: str = Query("vi"),
    db: AsyncSession = Depends(get_db),
):
    return await service.get_campaign_by_slug(db, slug=slug, locale=locale)


@admin_router.get("/campaigns")
async def admin_list_campaigns(
    page: int = Query(1, ge=1),
    pageSize: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(require_admin),
):
    return await service.admin_list_campaigns(db, page=page, page_size=pageSize)


@admin_router.post("/campaigns")
async def admin_create_campaign(
    body: AdminCreateCampaignRequest,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(require_admin),
):
    return await service.admin_create_campaign(db, body)


@admin_router.patch("/campaigns/{campaign_id}")
async def admin_patch_campaign(
    campaign_id: str,
    body: AdminPatchCampaignRequest,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(require_admin),
):
    return await service.admin_patch_campaign(db, campaign_id, body)
