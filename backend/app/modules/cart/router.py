from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.modules.cart.schemas import CartHydrateRequest, CartHydrateResponse
from app.modules.cart import service

router = APIRouter(prefix="/cart", tags=["cart"])


@router.post("/hydrate", response_model=CartHydrateResponse)
async def hydrate_cart(body: CartHydrateRequest, db: AsyncSession = Depends(get_db)):
    return await service.hydrate_cart(db, body)
