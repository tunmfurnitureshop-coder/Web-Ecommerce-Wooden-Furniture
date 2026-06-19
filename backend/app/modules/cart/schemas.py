from pydantic import BaseModel
from typing import List, Optional


class CartItemSelectedOptions(BaseModel):
    woodType: str
    finish: str
    size: str


class CartItemIn(BaseModel):
    productId: str
    quantity: int
    selectedOptions: CartItemSelectedOptions


class CartHydrateRequest(BaseModel):
    locale: str = "vi"
    items: List[CartItemIn]


class HydratedOptionLabel(BaseModel):
    code: str
    label: str


class HydratedSelectedOptions(BaseModel):
    woodType: HydratedOptionLabel
    finish: HydratedOptionLabel
    size: HydratedOptionLabel


class HydratedCartItem(BaseModel):
    productId: str
    sku: str
    name: str
    imageUrl: Optional[str] = None
    quantity: int
    selectedOptions: HydratedSelectedOptions
    unitPriceVnd: int
    lineTotalVnd: int


class CartHydrateResponse(BaseModel):
    items: List[HydratedCartItem]
    subtotalVnd: int
    totalVnd: int
    currency: str = "VND"
