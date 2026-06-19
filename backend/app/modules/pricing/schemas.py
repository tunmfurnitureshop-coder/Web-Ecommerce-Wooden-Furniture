from pydantic import BaseModel
from typing import Optional


class SelectedOptionsIn(BaseModel):
    woodType: str
    finish: str
    size: str


class PricingQuoteRequest(BaseModel):
    productId: str
    quantity: int
    selectedOptions: SelectedOptionsIn


class PriceBreakdown(BaseModel):
    basePriceVnd: int
    woodTypeDeltaVnd: int
    finishDeltaVnd: int
    sizeDeltaVnd: int


class PricingQuoteResponse(BaseModel):
    productId: str
    quantity: int
    unitPriceVnd: int
    lineTotalVnd: int
    breakdown: PriceBreakdown
