from fastapi import APIRouter, Depends, Query
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.modules.order.schemas import CreateOrderRequest, CreateOrderResponse, OrderSummaryResponse, UpdateOrderStatusRequest
from app.modules.order import service
from app.modules.auth.dependencies import require_admin

router = APIRouter(tags=["orders"])
admin_router = APIRouter(tags=["admin-orders"])


@router.post("/orders", response_model=CreateOrderResponse)
async def create_order(body: CreateOrderRequest, db: AsyncSession = Depends(get_db)):
    return await service.create_order(db, body)


@router.get("/orders/{order_code}", response_model=OrderSummaryResponse)
async def get_order(order_code: str, db: AsyncSession = Depends(get_db)):
    return await service.get_order_by_code(db, order_code)


@admin_router.get("/orders")
async def admin_list_orders(
    orderStatus: Optional[str] = Query(None),
    paymentStatus: Optional[str] = Query(None),
    paymentMethod: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    pageSize: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(require_admin),
):
    return await service.admin_get_orders(db, orderStatus, paymentStatus, paymentMethod, page, pageSize)


@admin_router.get("/orders/{order_id}")
async def admin_get_order(order_id: str, db: AsyncSession = Depends(get_db), _: dict = Depends(require_admin)):
    return await service.admin_get_order_detail(db, order_id)


@admin_router.patch("/orders/{order_id}/status")
async def admin_update_order_status(
    order_id: str, body: UpdateOrderStatusRequest,
    db: AsyncSession = Depends(get_db), _: dict = Depends(require_admin),
):
    return await service.admin_update_order_status(db, order_id, body)
