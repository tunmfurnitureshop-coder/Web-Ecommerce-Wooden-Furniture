from pydantic import BaseModel
from typing import Optional


class DashboardSummaryResponse(BaseModel):
    totalOrders: int
    totalRevenueVnd: int
    pendingOrders: int
    paidOrders: int
    lowStockProducts: int
    cancelledOrders: int
    newOrdersToday: int
    revenueTodayVnd: int
    failedPayments: int
