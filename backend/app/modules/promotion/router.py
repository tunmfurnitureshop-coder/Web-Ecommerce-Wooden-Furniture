from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.modules.promotion.schemas import CartQuoteRequest, CartQuoteResponse
from app.modules.promotion import evaluator

router = APIRouter(prefix="/cart", tags=["cart"])


@router.post("/quote", response_model=CartQuoteResponse)
async def cart_quote(body: CartQuoteRequest, db: AsyncSession = Depends(get_db)):
    return await evaluator.quote_cart(body, db)
