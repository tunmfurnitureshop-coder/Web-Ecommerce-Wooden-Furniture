from fastapi import APIRouter, Depends, Query
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.modules.auth.dependencies import require_admin

router = APIRouter(tags=["payment"])
admin_router = APIRouter(tags=["admin-payment"])


@admin_router.get("/payments")
async def admin_list_payments(
    provider: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    orderCode: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    pageSize: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(require_admin),
):
    from app.modules.payment import service
    return await service.admin_list_transactions(db, provider, status, orderCode, page, pageSize)
