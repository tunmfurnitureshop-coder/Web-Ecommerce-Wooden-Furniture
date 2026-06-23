import time
from collections import defaultdict
from fastapi import APIRouter, Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.exceptions import AppException
from app.core.security import decode_token
from app.modules.cart_recovery import service
from app.modules.cart_recovery.schemas import (
    CartRecoverySessionRequest, CartRecoverySessionResponse,
    CartRecoveryRestoreRequest, CartRecoveryRestoreResponse,
)

router = APIRouter(prefix="/cart", tags=["cart-recovery"])

_optional_bearer = HTTPBearer(auto_error=False)

# In-memory sliding-window rate limiter: 10 requests per 60 s per IP
_restore_hits: dict[str, list[float]] = defaultdict(list)
_RESTORE_LIMIT = 10
_RESTORE_WINDOW = 60


def _check_restore_rate(request: Request) -> None:
    ip = (request.client.host if request.client else None) or "unknown"
    now = time.monotonic()
    cutoff = now - _RESTORE_WINDOW
    hits = [t for t in _restore_hits[ip] if t > cutoff]
    if len(hits) >= _RESTORE_LIMIT:
        raise AppException(429, "RATE_LIMIT_EXCEEDED", "Too many restore attempts. Please try again later.")
    hits.append(now)
    _restore_hits[ip] = hits


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
    request: Request,
    body: CartRecoveryRestoreRequest,
    db: AsyncSession = Depends(get_db),
):
    _check_restore_rate(request)
    return await service.restore_cart(db, body)
