from fastapi import APIRouter, Depends, Query
from typing import Optional
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.modules.promotion import admin_service
from app.modules.auth.dependencies import require_admin

admin_router = APIRouter(tags=["admin-promotions"])


@admin_router.get("/promotions")
async def list_promotions(
    page: int = Query(1, ge=1),
    pageSize: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(require_admin),
):
    return await admin_service.list_promotions(db, page=page, page_size=pageSize)


@admin_router.post("/promotions")
async def create_promotion(
    body: dict,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(require_admin),
):
    return await admin_service.create_promotion(db, body)


@admin_router.get("/promotions/{promotion_id}")
async def get_promotion(
    promotion_id: str,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(require_admin),
):
    return await admin_service.get_promotion(db, promotion_id)


@admin_router.patch("/promotions/{promotion_id}")
async def patch_promotion(
    promotion_id: str,
    body: dict,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(require_admin),
):
    return await admin_service.patch_promotion(db, promotion_id, body)


@admin_router.delete("/promotions/{promotion_id}", status_code=204)
async def delete_promotion(
    promotion_id: str,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(require_admin),
):
    await admin_service.delete_promotion(db, promotion_id)


@admin_router.post("/promotions/{promotion_id}/products")
async def add_product_target(
    promotion_id: str,
    body: dict,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(require_admin),
):
    return await admin_service.add_product_target(db, promotion_id, body["productId"])


@admin_router.delete("/promotions/{promotion_id}/products/{product_id}", status_code=204)
async def remove_product_target(
    promotion_id: str,
    product_id: str,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(require_admin),
):
    await admin_service.remove_product_target(db, promotion_id, product_id)


@admin_router.post("/promotions/{promotion_id}/payment-methods")
async def add_payment_method_target(
    promotion_id: str,
    body: dict,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(require_admin),
):
    return await admin_service.add_payment_method_target(db, promotion_id, body["paymentMethod"])


@admin_router.delete("/promotions/{promotion_id}/payment-methods/{payment_method}", status_code=204)
async def remove_payment_method_target(
    promotion_id: str,
    payment_method: str,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(require_admin),
):
    await admin_service.remove_payment_method_target(db, promotion_id, payment_method)


@admin_router.get("/promotions/{promotion_id}/metrics")
async def get_promotion_metrics(
    promotion_id: str,
    from_: Optional[datetime] = Query(None, alias="from"),
    to: Optional[datetime] = Query(None),
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(require_admin),
):
    return await admin_service.get_promotion_metrics(db, promotion_id, from_dt=from_, to_dt=to)
