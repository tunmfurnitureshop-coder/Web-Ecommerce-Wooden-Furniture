from pydantic import BaseModel
from typing import Optional, List


class CartRecoveryItemIn(BaseModel):
    productId: str
    quantity: int
    selectedOptions: dict


class CartRecoverySessionRequest(BaseModel):
    anonymousId: Optional[str] = None
    sessionId: Optional[str] = None
    locale: str = "vi"
    email: Optional[str] = None
    marketingOptIn: bool = False
    items: List[CartRecoveryItemIn]


class CartRecoverySessionResponse(BaseModel):
    cartRecoverySessionId: str


class CartRecoveryRestoreRequest(BaseModel):
    token: str
    locale: str = "vi"


class CartRecoveryRestoreResponse(BaseModel):
    items: List[CartRecoveryItemIn]
