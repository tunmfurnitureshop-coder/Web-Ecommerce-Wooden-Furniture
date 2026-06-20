from abc import ABC, abstractmethod
from typing import Optional
from app.modules.payment.schemas import PaymentLinkResult, ParsedPaymentWebhook


class PaymentProviderInterface(ABC):
    @abstractmethod
    async def create_payment_link(self, order, transaction) -> PaymentLinkResult:
        ...

    @abstractmethod
    async def verify_webhook(self, payload: dict, signature: Optional[str]) -> bool:
        ...

    @abstractmethod
    async def parse_webhook(self, payload: dict) -> ParsedPaymentWebhook:
        ...
