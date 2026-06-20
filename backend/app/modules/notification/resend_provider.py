from typing import Optional
import httpx
from app.core.config import settings
from app.modules.notification.email_provider import EmailProviderInterface
from app.modules.payment.schemas import EmailSendResult


class ResendEmailProvider(EmailProviderInterface):
    async def send_email(
        self, to: str, subject: str, html: str, text: Optional[str] = None
    ) -> EmailSendResult:
        payload = {
            "from": settings.EMAIL_FROM,
            "to": [to],
            "subject": subject,
            "html": html,
        }
        if text:
            payload["text"] = text

        try:
            async with httpx.AsyncClient(timeout=15) as client:
                resp = await client.post(
                    "https://api.resend.com/emails",
                    json=payload,
                    headers={"Authorization": f"Bearer {settings.RESEND_API_KEY}"},
                )
            if resp.status_code in (200, 201):
                data = resp.json()
                return EmailSendResult(success=True, provider_message_id=data.get("id"), raw_response=data)
            else:
                return EmailSendResult(success=False, error_message=resp.text)
        except Exception as e:
            return EmailSendResult(success=False, error_message=str(e))
