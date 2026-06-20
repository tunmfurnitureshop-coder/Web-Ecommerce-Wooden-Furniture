from abc import ABC, abstractmethod
from typing import Optional
from app.modules.payment.schemas import EmailSendResult


class EmailProviderInterface(ABC):
    @abstractmethod
    async def send_email(
        self, to: str, subject: str, html: str, text: Optional[str] = None
    ) -> EmailSendResult:
        ...
