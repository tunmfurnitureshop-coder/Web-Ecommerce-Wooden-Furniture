from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class WishlistItemOut(BaseModel):
    productId: str
    slug: str
    name: str
    primaryImageUrl: Optional[str]
    basePriceVnd: int
    status: str
    addedAt: datetime


class WishlistListResponse(BaseModel):
    items: list[WishlistItemOut]


class AddWishlistRequest(BaseModel):
    productId: str
