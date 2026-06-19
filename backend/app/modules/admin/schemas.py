from pydantic import BaseModel


class DashboardSummaryResponse(BaseModel):
    totalOrders: int
    totalRevenueVnd: int
    pendingOrders: int
    paidOrders: int
    lowStockProducts: int
