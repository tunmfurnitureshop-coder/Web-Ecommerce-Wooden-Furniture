"""
T13-T14: Marketing consent enforcement in the Arq worker.
Worker functions are called directly with a mock Redis ctx.
"""
import sys
from unittest.mock import MagicMock, patch

# arq is not installed in the test environment; mock it before worker is imported.
if "arq" not in sys.modules:
    sys.modules["arq"] = MagicMock()
    sys.modules["arq.connections"] = MagicMock()

import uuid
import pytest
from datetime import datetime, timezone, timedelta
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.cart_recovery.models import CartRecoverySession

pytestmark = pytest.mark.asyncio


class _FakeRedis:
    """Minimal Redis mock — records enqueue_job calls, no network."""
    def __init__(self):
        self.enqueued: list[dict] = []

    async def enqueue_job(self, func_name: str, **kwargs):
        self.enqueued.append({"func": func_name, **kwargs})


def _ctx(fake_redis: _FakeRedis) -> dict:
    return {"redis": fake_redis}


async def _session(
    db: AsyncSession,
    *,
    marketing_opt_in: bool,
    customer_id: str | None = None,
    reminder_sent_at: datetime | None = None,
    last_activity_at: datetime | None = None,
) -> CartRecoverySession:
    s = CartRecoverySession(
        id=str(uuid.uuid4()),
        customer_id=customer_id,
        email="consent@example.com",
        email_hash="abc",
        marketing_opt_in=marketing_opt_in,
        locale="vi",
        cart_snapshot=[{"productId": "prod1", "quantity": 1, "selectedOptions": {}}],
        last_activity_at=last_activity_at or (datetime.now(timezone.utc) - timedelta(hours=4)),
        reminder_sent_at=reminder_sent_at,
    )
    db.add(s)
    await db.commit()
    return s


# T13 ────────────────────────────────────────────────────────────────────────
async def test_abandoned_cart_email_requires_marketing_opt_in(
    seeded_db, db_session: AsyncSession, test_session_factory
):
    opted_in = await _session(db_session, marketing_opt_in=True)
    opted_out = await _session(db_session, marketing_opt_in=False)

    fake_redis = _FakeRedis()
    from app.worker import evaluate_abandoned_carts
    with patch("app.worker.async_session_factory", test_session_factory):
        await evaluate_abandoned_carts(_ctx(fake_redis))

    await db_session.refresh(opted_in)
    await db_session.refresh(opted_out)

    assert opted_in.status == "ABANDONED", "Opted-in session must be marked ABANDONED"
    assert opted_out.status == "ACTIVE", "Opted-out session must remain ACTIVE"

    enqueued_ids = [j.get("session_id") for j in fake_redis.enqueued]
    assert opted_in.id in enqueued_ids
    assert opted_out.id not in enqueued_ids


async def test_logged_in_customer_consent_checked_from_customer_model(
    seeded_db, db_session: AsyncSession, test_session_factory
):
    """Logged-in sessions use customer.marketing_opt_in, not session field."""
    # cust_a has marketing_opt_in=False (default)
    opted_out_session = await _session(
        db_session, marketing_opt_in=True, customer_id="cust_a"
    )

    fake_redis = _FakeRedis()
    from app.worker import evaluate_abandoned_carts
    with patch("app.worker.async_session_factory", test_session_factory):
        await evaluate_abandoned_carts(_ctx(fake_redis))

    await db_session.refresh(opted_out_session)
    # Session-level opt_in=True is overridden by customer.marketing_opt_in=False
    assert opted_out_session.status == "ACTIVE"
    enqueued_ids = [j.get("session_id") for j in fake_redis.enqueued]
    assert opted_out_session.id not in enqueued_ids


# T14 ────────────────────────────────────────────────────────────────────────
async def test_abandoned_cart_email_sent_once_only(
    seeded_db, db_session: AsyncSession, test_session_factory
):
    already_sent = await _session(
        db_session,
        marketing_opt_in=True,
        reminder_sent_at=datetime.now(timezone.utc) - timedelta(hours=1),
    )
    already_sent.status = "ABANDONED"
    await db_session.commit()

    fake_redis = _FakeRedis()
    from app.worker import send_abandoned_cart_email
    with patch("app.worker.async_session_factory", test_session_factory):
        result = await send_abandoned_cart_email(_ctx(fake_redis), already_sent.id, "any-token")

    assert result.get("skipped") is True
    assert result.get("reason") == "reminder already sent"
