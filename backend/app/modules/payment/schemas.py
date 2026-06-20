from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class PaymentLinkResult(BaseModel):
    checkout_url: str
    provider_payment_link_id: Optional[str] = None
    provider_order_code: Optional[str] = None
    qr_code: Optional[str] = None
    raw_response: dict


class ParsedPaymentWebhook(BaseModel):
    provider_order_code: str
    amount_vnd: int
    status: str
    transaction_id: Optional[str] = None
    payment_link_id: Optional[str] = None
    raw_payload: dict


class EmailSendResult(BaseModel):
    success: bool
    provider_message_id: Optional[str] = None
    error_message: Optional[str] = None
    raw_response: Optional[dict] = None


class PaymentTransactionOut(BaseModel):
    id: str
    provider: str
    status: str
    amount_vnd: int
    provider_order_code: Optional[str] = None
    provider_payment_link_id: Optional[str] = None
    checkout_url: Optional[str] = None
    paid_at: Optional[datetime] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class AdminPaymentTransactionOut(BaseModel):
    id: str
    order_code: str
    provider: str
    status: str
    amount_vnd: int
    provider_order_code: Optional[str] = None
    provider_payment_link_id: Optional[str] = None
    created_at: datetime
    paid_at: Optional[datetime] = None
