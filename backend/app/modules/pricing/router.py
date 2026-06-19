from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.modules.pricing.schemas import PricingQuoteRequest, PricingQuoteResponse
from app.modules.pricing import service

router = APIRouter(prefix="/pricing", tags=["pricing"])


@router.post("/quote", response_model=PricingQuoteResponse)
async def get_quote(body: PricingQuoteRequest, db: AsyncSession = Depends(get_db)):
    return await service.calculate_quote(db, body)
