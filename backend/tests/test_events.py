"""
T1-T5: Commerce event timing correctness.
Tests run at the service layer to avoid PayOS network calls.
"""
import uuid
import pytest
from datetime import datetime, timezone
from sqlalchemy import select
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.events.models import CommerceEvent
from app.modules.order.models import Order
from app.modules.payment.models import PaymentTransaction
from app.shared.enums import PaymentTransactionStatus

pytestmark = pytest.mark.asyncio

_ORDER = {
    "customerName": "Event Test",
    "customerPhone": "0900000099",
    "customerEmail": "event@example.com",
    "shippingAddress": "Hà Nội",
    "paymentMethod": "COD",
    "items": [{"productId": "prod1", "quantity": 1,
               "selectedOptions": {"woodType": "oak", "finish": "natural", "size": "medium"}}],
}


async def _get_order(db: AsyncSession, order_code: str) -> Order:
    return (await db.execute(select(Order).where(Order.order_code == order_code))).scalar_one()


async def _dummy_tx(db: AsyncSession, order: Order) -> PaymentTransaction:
    tx = PaymentTransaction(
        id=str(uuid.uuid4()), order_id=order.id, provider="PAYOS",
        status=PaymentTransactionStatus.PENDING, amount_vnd=order.total_vnd,
        provider_order_code=str(uuid.uuid4()),
    )
    db.add(tx)
    await db.flush()
    return tx


async def _event_names(db: AsyncSession, order_id: str) -> list[str]:
    rows = (await db.execute(
        select(CommerceEvent.event_name).where(CommerceEvent.order_id == order_id)
    )).scalars().all()
    return list(rows)


# T1 ─────────────────────────────────────────────────────────────────────────
async def test_order_creation_emits_order_created_not_purchase_completed(
    client: AsyncClient, seeded_db, db_session: AsyncSession
):
    res = await client.post("/api/v1/orders", json=_ORDER)
    assert res.status_code == 200

    order = await _get_order(db_session, res.json()["orderCode"])
    names = await _event_names(db_session, order.id)

    assert "ORDER_CREATED" in names
    assert "PURCHASE_COMPLETED" not in names


# T2 ─────────────────────────────────────────────────────────────────────────
async def test_payment_success_emits_payment_completed_once(
    client: AsyncClient, seeded_db, db_session: AsyncSession
):
    res = await client.post("/api/v1/orders", json=_ORDER)
    order = await _get_order(db_session, res.json()["orderCode"])
    tx = await _dummy_tx(db_session, order)

    from app.modules.payment.service import apply_payment_success
    await apply_payment_success(db_session, tx, order)
    await db_session.commit()

    names = await _event_names(db_session, order.id)
    assert names.count("PAYMENT_COMPLETED") == 1


# T3 ─────────────────────────────────────────────────────────────────────────
async def test_payment_success_emits_purchase_completed_once(
    client: AsyncClient, seeded_db, db_session: AsyncSession
):
    res = await client.post("/api/v1/orders", json=_ORDER)
    order = await _get_order(db_session, res.json()["orderCode"])
    tx = await _dummy_tx(db_session, order)

    from app.modules.payment.service import apply_payment_success
    await apply_payment_success(db_session, tx, order)
    await db_session.commit()

    names = await _event_names(db_session, order.id)
    assert names.count("PURCHASE_COMPLETED") == 1


# T4 ─────────────────────────────────────────────────────────────────────────
async def test_duplicate_payment_success_does_not_duplicate_events(
    client: AsyncClient, seeded_db, db_session: AsyncSession
):
    res = await client.post("/api/v1/orders", json=_ORDER)
    order = await _get_order(db_session, res.json()["orderCode"])
    tx = await _dummy_tx(db_session, order)

    from app.modules.payment.service import apply_payment_success
    await apply_payment_success(db_session, tx, order)
    await db_session.commit()
    # Simulate duplicate webhook call
    await apply_payment_success(db_session, tx, order)
    await db_session.commit()

    names = await _event_names(db_session, order.id)
    assert names.count("PAYMENT_COMPLETED") == 1
    assert names.count("PURCHASE_COMPLETED") == 1


# T5 ─────────────────────────────────────────────────────────────────────────
async def test_failed_payment_does_not_emit_purchase_completed(
    client: AsyncClient, seeded_db, db_session: AsyncSession
):
    res = await client.post("/api/v1/orders", json=_ORDER)
    order = await _get_order(db_session, res.json()["orderCode"])
    tx = await _dummy_tx(db_session, order)

    from app.modules.payment.service import apply_payment_failed
    await apply_payment_failed(db_session, tx, order)
    await db_session.commit()

    names = await _event_names(db_session, order.id)
    assert "PURCHASE_COMPLETED" not in names
    assert "PAYMENT_COMPLETED" not in names
