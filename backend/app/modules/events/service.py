import uuid
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.modules.events.models import CommerceEvent
from app.modules.events.schemas import ClientEventRequest, ClientEventResponse
from app.shared.enums import CommerceEventSource

# Events that must be idempotent per order — duplicate dispatch is silently dropped
_IDEMPOTENT_ORDER_EVENTS = {
    "ORDER_CREATED",
    "PAYMENT_INITIATED",
    "PAYMENT_COMPLETED",
    "PURCHASE_COMPLETED",
    "ORDER_CANCELLED",
}


def _now() -> datetime:
    return datetime.now(timezone.utc)


async def ingest_client_event(
    db: AsyncSession,
    req: ClientEventRequest,
    customer_id: Optional[str] = None,
    campaign_id: Optional[str] = None,
) -> ClientEventResponse:
    now = _now()
    event = CommerceEvent(
        id=str(uuid.uuid4()),
        event_name=req.eventName,
        event_source=CommerceEventSource.CLIENT,
        customer_id=customer_id,
        anonymous_id=req.anonymousId,
        session_id=req.sessionId,
        product_id=req.productId,
        campaign_id=campaign_id,
        locale=req.locale,
        source_page=req.sourcePage,
        referrer=req.referrer,
        payload=req.payload or {},
        occurred_at=now,
    )
    db.add(event)
    await db.commit()
    return ClientEventResponse(eventId=event.id, occurredAt=now)


async def record_server_event(
    db: AsyncSession,
    event_name: str,
    order_id: Optional[str] = None,
    product_id: Optional[str] = None,
    promotion_id: Optional[str] = None,
    campaign_id: Optional[str] = None,
    customer_id: Optional[str] = None,
    payload: Optional[dict] = None,
) -> None:
    if order_id and event_name in _IDEMPOTENT_ORDER_EVENTS:
        existing = await db.execute(
            select(CommerceEvent.id).where(
                CommerceEvent.order_id == order_id,
                CommerceEvent.event_name == event_name,
            )
        )
        if existing.scalar_one_or_none():
            return
    db.add(CommerceEvent(
        id=str(uuid.uuid4()),
        event_name=event_name,
        event_source=CommerceEventSource.SERVER,
        order_id=order_id,
        product_id=product_id,
        promotion_id=promotion_id,
        campaign_id=campaign_id,
        customer_id=customer_id,
        payload=payload or {},
        occurred_at=_now(),
    ))
