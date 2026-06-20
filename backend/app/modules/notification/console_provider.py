import logging
from typing import Optional
from app.modules.notification.email_provider import EmailProviderInterface
from app.modules.payment.schemas import EmailSendResult

logger = logging.getLogger(__name__)


class ConsoleEmailProvider(EmailProviderInterface):
    async def send_email(
        self, to: str, subject: str, html: str, text: Optional[str] = None
    ) -> EmailSendResult:
        logger.info(f"[EMAIL] To: {to} | Subject: {subject}")
        logger.info(f"[EMAIL] Body preview: {(text or html)[:200]}")
        return EmailSendResult(success=True, provider_message_id="console-mock")
