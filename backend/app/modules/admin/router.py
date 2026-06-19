from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.modules.admin.schemas import DashboardSummaryResponse
from app.modules.admin import service
from app.modules.auth.dependencies import require_admin

router = APIRouter(tags=["admin-dashboard"])


@router.get("/dashboard/summary", response_model=DashboardSummaryResponse)
async def dashboard_summary(
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(require_admin),
):
    return await service.get_dashboard_summary(db)
