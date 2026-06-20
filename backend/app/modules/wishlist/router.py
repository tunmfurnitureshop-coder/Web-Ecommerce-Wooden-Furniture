from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.modules.customer_auth.dependencies import require_customer
from app.modules.customer_auth.models import Customer
from app.modules.wishlist import service
from app.modules.wishlist.schemas import WishlistListResponse, WishlistItemOut, AddWishlistRequest

router = APIRouter(prefix="/wishlist", tags=["wishlist"])


@router.get("", response_model=WishlistListResponse)
async def list_wishlist(
    locale: str = Query("vi"),
    customer: Customer = Depends(require_customer),
    db: AsyncSession = Depends(get_db),
):
    return await service.list_wishlist(db, customer.id, locale)


@router.post("/items", response_model=WishlistItemOut, status_code=200)
async def add_item(
    body: AddWishlistRequest,
    locale: str = Query("vi"),
    customer: Customer = Depends(require_customer),
    db: AsyncSession = Depends(get_db),
):
    item = await service.add_item(db, customer.id, body.productId, locale)
    await db.commit()
    return item


@router.delete("/items/{product_id}", status_code=204)
async def remove_item(
    product_id: str,
    customer: Customer = Depends(require_customer),
    db: AsyncSession = Depends(get_db),
):
    await service.remove_item(db, customer.id, product_id)
    await db.commit()
