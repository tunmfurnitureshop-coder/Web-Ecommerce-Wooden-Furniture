from pydantic import BaseModel
from typing import List


class InventoryItemOut(BaseModel):
    productId: str
    sku: str
    nameVi: str
    totalQty: int
    reservedQty: int
    availableQty: int


class InventoryListResponse(BaseModel):
    items: List[InventoryItemOut]


class UpdateInventoryRequest(BaseModel):
    totalQty: int
