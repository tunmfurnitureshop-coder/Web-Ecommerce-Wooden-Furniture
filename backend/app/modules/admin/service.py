from datetime import datetime, timezone, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.modules.order.models import Order
from app.modules.inventory.models import InventoryItem
from app.modules.admin.schemas import DashboardSummaryResponse
from app.shared.enums import PaymentStatus, OrderStatus

LOW_STOCK_THRESHOLD = 5


async def get_dashboard_summary(db: AsyncSession) -> DashboardSummaryResponse:
    total_orders = (await db.execute(select(func.count(Order.id)))).scalar_one()

    total_revenue = (await db.execute(
        select(func.coalesce(func.sum(Order.total_vnd), 0))
        .where(Order.payment_status == PaymentStatus.PAID)
    )).scalar_one()

    pending_orders = (await db.execute(
        select(func.count(Order.id)).where(Order.order_status == OrderStatus.PENDING_PAYMENT)
    )).scalar_one()

    paid_orders = (await db.execute(
        select(func.count(Order.id)).where(Order.payment_status == PaymentStatus.PAID)
    )).scalar_one()

    cancelled_orders = (await db.execute(
        select(func.count(Order.id)).where(Order.order_status == OrderStatus.CANCELLED)
    )).scalar_one()

    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    new_orders_today = (await db.execute(
        select(func.count(Order.id)).where(Order.created_at >= today_start)
    )).scalar_one()

    revenue_today = (await db.execute(
        select(func.coalesce(func.sum(Order.total_vnd), 0))
        .where(Order.payment_status == PaymentStatus.PAID, Order.payment_completed_at >= today_start)
    )).scalar_one()

    failed_payments = (await db.execute(
        select(func.count(Order.id)).where(Order.payment_status == PaymentStatus.FAILED)
    )).scalar_one()

    low_stock_result = await db.execute(select(InventoryItem))
    low_stock = sum(1 for inv in low_stock_result.scalars().all() if inv.available_qty < LOW_STOCK_THRESHOLD)

    return DashboardSummaryResponse(
        totalOrders=total_orders,
        totalRevenueVnd=total_revenue,
        pendingOrders=pending_orders,
        paidOrders=paid_orders,
        lowStockProducts=low_stock,
        cancelledOrders=cancelled_orders,
        newOrdersToday=new_orders_today,
        revenueTodayVnd=revenue_today,
        failedPayments=failed_payments,
    )


async def confirm_manual_payment(db: AsyncSession, order_id: str, note: str | None, actor_id: str | None = None) -> dict:
    from app.modules.order.models import Order
    from app.modules.order.events import create_order_event
    from app.shared.enums import OrderEventActorType
    order = (await db.execute(select(Order).where(Order.id == order_id))).scalar_one_or_none()
    if not order:
        from app.core.exceptions import AppException
        raise AppException(404, "ORDER_NOT_FOUND", "Order not found.")
    if order.payment_status == PaymentStatus.PAID:
        from app.core.exceptions import AppException
        raise AppException(422, "PAYMENT_STATUS_INVALID_TRANSITION", "Order already paid.")
    prev_payment_status = order.payment_status
    prev_order_status = order.order_status
    order.payment_status = PaymentStatus.PAID
    order.order_status = OrderStatus.PROCESSING
    order.payment_completed_at = datetime.now(timezone.utc)
    order.payment_provider = "MANUAL"
    await create_order_event(
        db, order.id, "MANUAL_PAYMENT_CONFIRMED", OrderEventActorType.ADMIN,
        old_value={"paymentStatus": prev_payment_status, "orderStatus": prev_order_status},
        new_value={"paymentStatus": PaymentStatus.PAID, "orderStatus": OrderStatus.PROCESSING},
        note=note, actor_id=actor_id,
    )
    await db.commit()
    try:
        from app.modules.notification.service import send_payment_success_emails
        await send_payment_success_emails(db, order)
        await db.commit()
    except Exception:
        pass
    return {"orderCode": order.order_code, "paymentStatus": order.payment_status, "orderStatus": order.order_status}
