"""
T9-T12: Cart recovery token security.
"""
import hashlib
import uuid
import pytest
from datetime import datetime, timezone, timedelta
from sqlalchemy import select
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.cart_recovery.models import CartRecoverySession
from app.modules.cart_recovery.schemas import (
    CartRecoverySessionRequest, CartRecoveryRestoreRequest, CartRecoveryItemIn,
)
from app.modules.cart_recovery import service as recovery_service

pytestmark = pytest.mark.asyncio

_ITEMS = [CartRecoveryItemIn(productId="prod1", quantity=2, selectedOptions={"woodType": "oak"})]
_SNAP = [{"productId": "prod1", "quantity": 2, "selectedOptions": {"woodType": "oak"}}]


async def _make_session(db: AsyncSession, *, purchased_at=None) -> CartRecoverySession:
    session = CartRecoverySession(
        id=str(uuid.uuid4()), email="recover@example.com",
        email_hash=hashlib.sha256(b"recover@example.com").hexdigest(),
        marketing_opt_in=True, locale="vi", cart_snapshot=_SNAP,
        last_activity_at=datetime.now(timezone.utc),
        purchased_at=purchased_at,
    )
    db.add(session)
    await db.commit()
    return session


# T9 ─────────────────────────────────────────────────────────────────────────
async def test_recovery_token_stored_as_hash_not_plaintext(
    seeded_db, db_session: AsyncSession
):
    session = await _make_session(db_session)
    raw_token = await recovery_service.generate_recovery_token(db_session, session.id)

    await db_session.refresh(session)
    expected_hash = hashlib.sha256(raw_token.encode()).hexdigest()

    assert session.recovery_token_hash is not None
    assert session.recovery_token_hash != raw_token, "Raw token must not be stored"
    assert session.recovery_token_hash == expected_hash, "Hash must be SHA-256 of raw token"


# T10 ────────────────────────────────────────────────────────────────────────
async def test_expired_recovery_token_returns_410(
    client: AsyncClient, seeded_db, db_session: AsyncSession
):
    session = await _make_session(db_session)
    raw_token = await recovery_service.generate_recovery_token(db_session, session.id)

    # Expire the token
    session.recovery_token_expires_at = datetime.now(timezone.utc) - timedelta(hours=1)
    await db_session.commit()

    res = await client.post("/api/v1/cart/recovery/restore", json={"token": raw_token})
    assert res.status_code == 410
    assert res.json()["error"]["code"] == "CART_RECOVERY_TOKEN_EXPIRED"


# T11 ────────────────────────────────────────────────────────────────────────
async def test_restore_returns_only_product_ids_and_quantities_no_prices(
    client: AsyncClient, seeded_db, db_session: AsyncSession
):
    session = await _make_session(db_session)
    raw_token = await recovery_service.generate_recovery_token(db_session, session.id)

    res = await client.post("/api/v1/cart/recovery/restore", json={"token": raw_token})
    assert res.status_code == 200

    data = res.json()
    assert "items" in data
    assert len(data["items"]) == 1

    item = data["items"][0]
    assert "productId" in item
    assert "quantity" in item
    # Must not include any price fields
    for price_key in ("price", "unitPrice", "lineTotal", "priceVnd", "totalVnd"):
        assert price_key not in item, f"Field '{price_key}' must not appear in restore response"


# T12 ────────────────────────────────────────────────────────────────────────
async def test_restore_after_purchase_returns_410(
    client: AsyncClient, seeded_db, db_session: AsyncSession
):
    session = await _make_session(
        db_session, purchased_at=datetime.now(timezone.utc)
    )
    raw_token = await recovery_service.generate_recovery_token(db_session, session.id)

    res = await client.post("/api/v1/cart/recovery/restore", json={"token": raw_token})
    assert res.status_code == 410
    assert res.json()["error"]["code"] == "CART_RECOVERY_ALREADY_PURCHASED"
