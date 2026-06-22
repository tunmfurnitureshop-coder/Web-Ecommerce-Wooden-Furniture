import uuid
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.modules.payment.models import PaymentTransaction
from app.modules.order.models import Order
from app.modules.order.events import create_order_event
from app.shared.enums import PaymentTransactionStatus, OrderEventActorType, OrderStatus, PaymentStatus
from app.core.exceptions import AppException


async def create_payment_transaction(
    db: AsyncSession,
    order: Order,
    provider: str,
) -> PaymentTransaction:
    tx = PaymentTransaction(
        id=str(uuid.uuid4()),
        order_id=order.id,
        provider=provider,
        status=PaymentTransactionStatus.CREATED,
        amount_vnd=order.total_vnd,
    )
    db.add(tx)
    return tx


async def get_transaction_by_provider_order_code(
    db: AsyncSession, provider_order_code: str
) -> Optional[PaymentTransaction]:
    result = await db.execute(
        select(PaymentTransaction).where(PaymentTransaction.provider_order_code == provider_order_code)
    )
    return result.scalar_one_or_none()


async def get_transaction_by_payment_link_id(
    db: AsyncSession, payment_link_id: str
) -> Optional[PaymentTransaction]:
    result = await db.execute(
        select(PaymentTransaction).where(PaymentTransaction.provider_payment_link_id == payment_link_id)
    )
    return result.scalar_one_or_none()


async def apply_payment_success(db: AsyncSession, tx: PaymentTransaction, order: Order):
    from app.modules.promotion import lifecycle as promo_lifecycle
    now = datetime.now(timezone.utc)
    old_payment = order.payment_status
    old_order = order.order_status
    tx.status = PaymentTransactionStatus.PAID
    tx.paid_at = now
    order.payment_status = PaymentStatus.PAID
    order.order_status = OrderStatus.PAID
    order.payment_completed_at = now
    order.latest_payment_transaction_id = tx.id
    await create_order_event(
        db, order.id, "PAYMENT_PAID", OrderEventActorType.WEBHOOK,
        old_value={"paymentStatus": old_payment, "orderStatus": old_order},
        new_value={"paymentStatus": PaymentStatus.PAID, "orderStatus": OrderStatus.PAID},
    )
    await promo_lifecycle.redeem_for_order(db, order.id)


async def apply_payment_cancelled(db: AsyncSession, tx: PaymentTransaction, order: Order):
    from app.modules.promotion import lifecycle as promo_lifecycle
    now = datetime.now(timezone.utc)
    old_payment = order.payment_status
    old_order = order.order_status
    tx.status = PaymentTransactionStatus.CANCELLED
    tx.cancelled_at = now
    order.payment_status = PaymentStatus.CANCELLED
    order.order_status = OrderStatus.CANCELLED
    await create_order_event(
        db, order.id, "PAYMENT_CANCELLED", OrderEventActorType.WEBHOOK,
        old_value={"paymentStatus": old_payment, "orderStatus": old_order},
        new_value={"paymentStatus": PaymentStatus.CANCELLED, "orderStatus": OrderStatus.CANCELLED},
    )
    from app.modules.inventory.models import InventoryItem
    released = []
    for item in order.items:
        inv = (await db.execute(select(InventoryItem).where(InventoryItem.product_id == item.product_id))).scalar_one_or_none()
        if inv:
            inv.reserved_qty = max(0, inv.reserved_qty - item.quantity)
            released.append({"productId": item.product_id, "quantity": item.quantity})
    await create_order_event(
        db, order.id, "INVENTORY_RESERVATION_RELEASED", OrderEventActorType.WEBHOOK,
        new_value={"items": released},
    )
    await promo_lifecycle.release_for_order(db, order.id)


async def apply_payment_failed(db: AsyncSession, tx: PaymentTransaction, order: Order):
    tx.status = PaymentTransactionStatus.FAILED
    order.payment_status = PaymentStatus.FAILED
    order.order_status = OrderStatus.PENDING_PAYMENT
    await create_order_event(
        db, order.id, "PAYMENT_FAILED", OrderEventActorType.WEBHOOK,
        new_value={"paymentStatus": PaymentStatus.FAILED},
    )


async def admin_list_transactions(
    db: AsyncSession,
    provider: Optional[str] = None,
    status: Optional[str] = None,
    order_code: Optional[str] = None,
    page: int = 1,
    page_size: int = 20,
) -> dict:
    query = select(PaymentTransaction, Order.order_code).join(Order, PaymentTransaction.order_id == Order.id)
    if provider:
        query = query.where(PaymentTransaction.provider == provider)
    if status:
        query = query.where(PaymentTransaction.status == status)
    if order_code:
        query = query.where(Order.order_code.ilike(f"%{order_code}%"))

    count_result = await db.execute(select(func.count(PaymentTransaction.id)))
    total = count_result.scalar_one()

    rows = (await db.execute(
        query.order_by(PaymentTransaction.created_at.desc())
        .offset((page - 1) * page_size).limit(page_size)
    )).all()

    items = [
        {
            "id": tx.id, "orderCode": oc, "provider": tx.provider, "status": tx.status,
            "amountVnd": tx.amount_vnd, "providerOrderCode": tx.provider_order_code,
            "providerPaymentLinkId": tx.provider_payment_link_id,
            "createdAt": tx.created_at, "paidAt": tx.paid_at,
        }
        for tx, oc in rows
    ]
    return {"items": items, "page": page, "pageSize": page_size, "total": total}
