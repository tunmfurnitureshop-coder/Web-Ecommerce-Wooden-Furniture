from pydantic import BaseModel
from typing import Optional


class ProductImageOut(BaseModel):
    id: str
    productId: str
    imageUrl: str
    storageKey: str
    altText: Optional[str] = None
    sortOrder: int
    isPrimary: bool
    linkedFinishCode: Optional[str] = None

    model_config = {"from_attributes": True}


class UpdateProductImageRequest(BaseModel):
    altText: Optional[str] = None
    sortOrder: Optional[int] = None
    isPrimary: Optional[bool] = None
    linkedFinishCode: Optional[str] = None
