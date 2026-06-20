import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from app.modules.webhook.models import WebhookEvent
from app.modules.order.models import Order
from app.shared.enums import WebhookProcessingStatus, PaymentStatus


async def store_webhook_event(
    db: AsyncSession,
    provider: str,
    payload: dict,
    signature: str = None,
    external_event_id: str = None,
    event_type: str = None,
) -> WebhookEvent:
    event = WebhookEvent(
        id=str(uuid.uuid4()),
        provider=provider,
        external_event_id=external_event_id,
        event_type=event_type,
        signature=signature,
        payload=payload,
        processing_status=WebhookProcessingStatus.RECEIVED,
    )
    db.add(event)
    await db.flush()
    return event


async def check_already_paid(db: AsyncSession, order: Order) -> bool:
    return order.payment_status == PaymentStatus.PAID
