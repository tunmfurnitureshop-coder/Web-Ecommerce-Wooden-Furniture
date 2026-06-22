from fastapi import APIRouter, Depends, Query
from typing import Optional
from datetime import datetime
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


@admin_router.get("/campaigns/{campaign_id}")
async def admin_get_campaign(
    campaign_id: str,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(require_admin),
):
    return await service.admin_get_campaign(db, campaign_id)


@admin_router.patch("/campaigns/{campaign_id}")
async def admin_patch_campaign(
    campaign_id: str,
    body: AdminPatchCampaignRequest,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(require_admin),
):
    return await service.admin_patch_campaign(db, campaign_id, body)


@admin_router.delete("/campaigns/{campaign_id}", status_code=204)
async def admin_delete_campaign(
    campaign_id: str,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(require_admin),
):
    await service.admin_delete_campaign(db, campaign_id)


@admin_router.post("/campaigns/{campaign_id}/promotions")
async def admin_add_campaign_promotion(
    campaign_id: str,
    body: dict,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(require_admin),
):
    return await service.admin_add_campaign_promotion(db, campaign_id, body["promotionId"])


@admin_router.delete("/campaigns/{campaign_id}/promotions/{promotion_id}", status_code=204)
async def admin_remove_campaign_promotion(
    campaign_id: str,
    promotion_id: str,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(require_admin),
):
    await service.admin_remove_campaign_promotion(db, campaign_id, promotion_id)


@admin_router.post("/campaigns/{campaign_id}/products")
async def admin_add_campaign_product(
    campaign_id: str,
    body: dict,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(require_admin),
):
    return await service.admin_add_campaign_product(db, campaign_id, body["productId"], body.get("sortOrder", 0))


@admin_router.delete("/campaigns/{campaign_id}/products/{product_id}", status_code=204)
async def admin_remove_campaign_product(
    campaign_id: str,
    product_id: str,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(require_admin),
):
    await service.admin_remove_campaign_product(db, campaign_id, product_id)


@admin_router.post("/campaigns/{campaign_id}/collections")
async def admin_add_campaign_collection(
    campaign_id: str,
    body: dict,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(require_admin),
):
    return await service.admin_add_campaign_collection(db, campaign_id, body["collectionId"], body.get("sortOrder", 0))


@admin_router.delete("/campaigns/{campaign_id}/collections/{collection_id}", status_code=204)
async def admin_remove_campaign_collection(
    campaign_id: str,
    collection_id: str,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(require_admin),
):
    await service.admin_remove_campaign_collection(db, campaign_id, collection_id)


@admin_router.get("/campaigns/{campaign_id}/metrics")
async def admin_campaign_metrics(
    campaign_id: str,
    from_: Optional[datetime] = Query(None, alias="from"),
    to: Optional[datetime] = Query(None),
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(require_admin),
):
    return await service.get_campaign_metrics(db, campaign_id, from_dt=from_, to_dt=to)
