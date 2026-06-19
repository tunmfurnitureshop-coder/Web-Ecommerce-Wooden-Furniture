from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.modules.order.models import Order
from app.modules.inventory.models import InventoryItem
from app.modules.admin.schemas import DashboardSummaryResponse
from app.shared.enums import PaymentStatus, OrderStatus

LOW_STOCK_THRESHOLD = 5


async def get_dashboard_summary(db: AsyncSession) -> DashboardSummaryResponse:
    total_orders = (await db.execute(select(func.count(Order.id)))).scalar_one()

    revenue_result = await db.execute(
        select(func.coalesce(func.sum(Order.total_vnd), 0))
        .where(Order.payment_status == PaymentStatus.PAID)
    )
    total_revenue = revenue_result.scalar_one()

    pending_orders = (await db.execute(
        select(func.count(Order.id)).where(Order.order_status == OrderStatus.PENDING_PAYMENT)
    )).scalar_one()

    paid_orders = (await db.execute(
        select(func.count(Order.id)).where(Order.payment_status == PaymentStatus.PAID)
    )).scalar_one()

    low_stock_result = await db.execute(select(InventoryItem))
    low_stock = sum(1 for inv in low_stock_result.scalars().all() if inv.available_qty < LOW_STOCK_THRESHOLD)

    return DashboardSummaryResponse(
        totalOrders=total_orders,
        totalRevenueVnd=total_revenue,
        pendingOrders=pending_orders,
        paidOrders=paid_orders,
        lowStockProducts=low_stock,
    )
