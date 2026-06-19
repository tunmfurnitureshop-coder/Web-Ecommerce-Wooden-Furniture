from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.modules.inventory.schemas import InventoryListResponse, InventoryItemOut, UpdateInventoryRequest
from app.modules.inventory import service
from app.modules.auth.dependencies import require_admin

router = APIRouter(tags=["admin-inventory"])


@router.get("/inventory", response_model=InventoryListResponse)
async def list_inventory(db: AsyncSession = Depends(get_db), _: dict = Depends(require_admin)):
    return await service.list_inventory(db)


@router.patch("/inventory/{product_id}", response_model=InventoryItemOut)
async def update_inventory(
    product_id: str, body: UpdateInventoryRequest,
    db: AsyncSession = Depends(get_db), _: dict = Depends(require_admin),
):
    return await service.update_inventory(db, product_id, body)
