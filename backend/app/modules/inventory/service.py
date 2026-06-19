from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.modules.inventory.models import InventoryItem
from app.modules.product.models import Product, ProductTranslation
from app.modules.inventory.schemas import InventoryListResponse, InventoryItemOut, UpdateInventoryRequest
from app.core.exceptions import AppException, not_found


async def list_inventory(db: AsyncSession) -> InventoryListResponse:
    result = await db.execute(
        select(InventoryItem).options(
            selectinload(InventoryItem.product).selectinload(Product.translations)
        )
    )
    items = result.scalars().all()
    out = []
    for inv in items:
        p = inv.product
        vi_trans = next((t for t in p.translations if t.locale == "vi"), None)
        out.append(InventoryItemOut(
            productId=p.id, sku=p.sku,
            nameVi=vi_trans.name if vi_trans else p.sku,
            totalQty=inv.total_qty, reservedQty=inv.reserved_qty, availableQty=inv.available_qty,
        ))
    return InventoryListResponse(items=out)


async def update_inventory(db: AsyncSession, product_id: str, req: UpdateInventoryRequest) -> InventoryItemOut:
    inv = (await db.execute(select(InventoryItem).where(InventoryItem.product_id == product_id).options(
        selectinload(InventoryItem.product).selectinload(Product.translations)
    ))).scalar_one_or_none()
    if not inv:
        raise not_found("Inventory")

    if req.totalQty < inv.reserved_qty:
        raise AppException(422, "VALIDATION_ERROR", "total_qty cannot be less than reserved_qty.")

    inv.total_qty = req.totalQty
    await db.commit()

    p = inv.product
    vi_trans = next((t for t in p.translations if t.locale == "vi"), None)
    return InventoryItemOut(
        productId=p.id, sku=p.sku,
        nameVi=vi_trans.name if vi_trans else p.sku,
        totalQty=inv.total_qty, reservedQty=inv.reserved_qty, availableQty=inv.available_qty,
    )
