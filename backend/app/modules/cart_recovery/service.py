import hashlib
import secrets
from datetime import datetime, timezone, timedelta
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from app.modules.cart_recovery.models import CartRecoverySession
from app.modules.cart_recovery.schemas import (
    CartRecoverySessionRequest, CartRecoverySessionResponse,
    CartRecoveryRestoreRequest, CartRecoveryRestoreResponse, CartRecoveryItemIn,
)
from app.core.config import settings
from app.core.exceptions import AppException


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _email_hash(email: str) -> str:
    return hashlib.sha256(email.lower().strip().encode()).hexdigest()


def _token_hash(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


async def upsert_session(
    db: AsyncSession,
    req: CartRecoverySessionRequest,
    customer_id: Optional[str] = None,
) -> CartRecoverySessionResponse:
    cart_snapshot = [
        {"productId": i.productId, "quantity": i.quantity, "selectedOptions": i.selectedOptions}
        for i in req.items
    ]

    # Try to find an existing ACTIVE session by anonymous/session/customer identity
    query = None
    if customer_id:
        query = select(CartRecoverySession).where(
            CartRecoverySession.customer_id == customer_id,
            CartRecoverySession.status == "ACTIVE",
        )
    elif req.anonymousId:
        query = select(CartRecoverySession).where(
            CartRecoverySession.anonymous_id == req.anonymousId,
            CartRecoverySession.status == "ACTIVE",
        )

    session = None
    if query is not None:
        session = (await db.execute(query.order_by(CartRecoverySession.created_at.desc()))).scalar_one_or_none()

    email_hash = _email_hash(req.email) if req.email else None

    if session:
        session.cart_snapshot = cart_snapshot
        session.last_activity_at = _now()
        session.locale = req.locale
        if req.email:
            session.email = req.email
            session.email_hash = email_hash
        if req.marketingOptIn:
            session.marketing_opt_in = True
        if customer_id:
            session.customer_id = customer_id
    else:
        session = CartRecoverySession(
            customer_id=customer_id,
            anonymous_id=req.anonymousId,
            session_id=req.sessionId,
            email=req.email,
            email_hash=email_hash,
            marketing_opt_in=req.marketingOptIn,
            locale=req.locale,
            cart_snapshot=cart_snapshot,
            last_activity_at=_now(),
        )
        db.add(session)

    await db.commit()
    return CartRecoverySessionResponse(cartRecoverySessionId=session.id)


async def generate_recovery_token(db: AsyncSession, session_id: str) -> str:
    session = (await db.execute(
        select(CartRecoverySession).where(CartRecoverySession.id == session_id)
    )).scalar_one_or_none()
    if not session:
        raise AppException(404, "CART_SESSION_NOT_FOUND", "Cart recovery session not found.")
    token = secrets.token_urlsafe(32)
    expires_at = _now() + timedelta(hours=settings.ABANDONED_CART_TOKEN_TTL_HOURS)
    session.recovery_token_hash = _token_hash(token)
    session.recovery_token_expires_at = expires_at
    await db.commit()
    return token


async def restore_cart(
    db: AsyncSession,
    req: CartRecoveryRestoreRequest,
) -> CartRecoveryRestoreResponse:
    token_hash = _token_hash(req.token)
    session = (await db.execute(
        select(CartRecoverySession).where(
            CartRecoverySession.recovery_token_hash == token_hash,
        )
    )).scalar_one_or_none()
    if not session:
        raise AppException(404, "CART_RECOVERY_INVALID_TOKEN", "Recovery token is invalid or expired.")
    now = _now()
    if session.purchased_at is not None:
        raise AppException(410, "CART_RECOVERY_ALREADY_PURCHASED", "This cart has already been purchased.")
    if session.recovery_token_expires_at:
        expires = session.recovery_token_expires_at
        if expires.tzinfo is None:
            expires = expires.replace(tzinfo=timezone.utc)
        if now > expires:
            raise AppException(410, "CART_RECOVERY_TOKEN_EXPIRED", "Recovery token has expired.")
    if session.status not in ("ACTIVE", "ABANDONED"):
        raise AppException(404, "CART_RECOVERY_INVALID_TOKEN", "Recovery token is no longer valid.")

    items = [
        CartRecoveryItemIn(
            productId=item["productId"],
            quantity=item["quantity"],
            selectedOptions=item.get("selectedOptions", {}),
        )
        for item in (session.cart_snapshot or [])
        if item.get("productId")
    ]
    return CartRecoveryRestoreResponse(items=items)
