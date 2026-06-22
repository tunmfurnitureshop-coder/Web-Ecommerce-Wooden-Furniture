from fastapi import APIRouter, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.security import decode_token
from app.modules.cart_recovery import service
from app.modules.cart_recovery.schemas import (
    CartRecoverySessionRequest, CartRecoverySessionResponse,
    CartRecoveryRestoreRequest, CartRecoveryRestoreResponse,
)

router = APIRouter(prefix="/cart", tags=["cart-recovery"])

_optional_bearer = HTTPBearer(auto_error=False)


@router.post("/recovery/session", response_model=CartRecoverySessionResponse)
async def upsert_recovery_session(
    body: CartRecoverySessionRequest,
    db: AsyncSession = Depends(get_db),
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(_optional_bearer),
):
    customer_id = None
    if credentials:
        payload = decode_token(credentials.credentials)
        if payload and payload.get("role") == "customer":
            customer_id = payload.get("sub")
    return await service.upsert_session(db, body, customer_id=customer_id)


@router.post("/recovery/restore", response_model=CartRecoveryRestoreResponse)
async def restore_cart(
    body: CartRecoveryRestoreRequest,
    db: AsyncSession = Depends(get_db),
):
    return await service.restore_cart(db, body)
