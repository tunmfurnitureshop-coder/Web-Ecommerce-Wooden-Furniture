from pydantic import BaseModel
from typing import List, Optional, Any, Dict
from datetime import datetime


class OrderItemIn(BaseModel):
    productId: str
    quantity: int
    selectedOptions: Dict[str, str]


class CreateOrderRequest(BaseModel):
    customerName: str
    customerPhone: str
    customerEmail: Optional[str] = None
    shippingAddress: str
    note: Optional[str] = None
    paymentMethod: str
    items: List[OrderItemIn]


class CreateOrderResponse(BaseModel):
    orderCode: str
    orderStatus: str
    paymentStatus: str
    paymentMethod: str
    totalVnd: int
    currency: str = "VND"
    checkoutUrl: Optional[str] = None
    paymentTransactionId: Optional[str] = None


class OrderItemOut(BaseModel):
    productId: str
    productNameSnapshot: str
    productSkuSnapshot: str
    selectedOptionsSnapshot: Dict[str, Any]
    unitPriceVnd: int
    quantity: int
    lineTotalVnd: int


class OrderSummaryResponse(BaseModel):
    orderCode: str
    customerName: str
    orderStatus: str
    paymentStatus: str
    paymentMethod: str
    items: List[OrderItemOut]
    totalVnd: int
    currency: str = "VND"
    createdAt: datetime


class UpdateOrderStatusRequest(BaseModel):
    orderStatus: Optional[str] = None
    paymentStatus: Optional[str] = None


class ConfirmManualPaymentRequest(BaseModel):
    note: Optional[str] = None
