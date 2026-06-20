from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class CustomerOrderListItem(BaseModel):
    orderCode: str
    createdAt: datetime
    totalVnd: int
    paymentStatus: str
    orderStatus: str
    itemCount: int
    primaryImageUrl: Optional[str]


class CustomerOrderListResponse(BaseModel):
    items: list[CustomerOrderListItem]
    page: int
    pageSize: int
    total: int


class CustomerOrderItemOut(BaseModel):
    productId: str
    productNameSnapshot: str
    productSkuSnapshot: str
    selectedOptionsSnapshot: dict
    unitPriceVnd: int
    quantity: int
    lineTotalVnd: int


class OrderEventOut(BaseModel):
    eventType: str
    actorType: str
    note: Optional[str]
    createdAt: datetime


class CustomerOrderDetailOut(BaseModel):
    orderCode: str
    customerName: str
    customerPhone: str
    customerEmail: Optional[str]
    shippingAddress: str
    note: Optional[str]
    subtotalVnd: int
    shippingFeeVnd: int
    totalVnd: int
    orderStatus: str
    paymentStatus: str
    paymentMethod: str
    createdAt: datetime
    items: list[CustomerOrderItemOut]
    events: list[OrderEventOut]


class ReorderItemOut(BaseModel):
    productId: str
    quantity: int
    selectedOptions: dict
    currentUnitPriceVnd: int


class UnavailableItemOut(BaseModel):
    productId: str
    productSkuSnapshot: str
    reason: str  # PRODUCT_INACTIVE | OPTIONS_UNAVAILABLE | OUT_OF_STOCK


class ReorderResponse(BaseModel):
    items: list[ReorderItemOut]
    unavailableItems: list[UnavailableItemOut]


class ClaimOrdersResponse(BaseModel):
    claimedOrderCount: int
