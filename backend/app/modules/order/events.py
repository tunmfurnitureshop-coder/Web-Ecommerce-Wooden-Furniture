import uuid
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import String, Text, DateTime, ForeignKey, Index, JSON
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base


class OrderEvent(Base):
    __tablename__ = "order_events"
    __table_args__ = (
        Index("idx_order_events_order_id", "order_id"),
    )

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    order_id: Mapped[str] = mapped_column(String, ForeignKey("orders.id"), nullable=False)

    event_type: Mapped[str] = mapped_column(String, nullable=False)
    old_value: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    new_value: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)

    actor_type: Mapped[str] = mapped_column(String, nullable=False)
    actor_id: Mapped[Optional[str]] = mapped_column(String, nullable=True)

    note: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))


async def create_order_event(
    db,
    order_id: str,
    event_type: str,
    actor_type: str,
    old_value: Optional[dict] = None,
    new_value: Optional[dict] = None,
    note: Optional[str] = None,
    actor_id: Optional[str] = None,
) -> "OrderEvent":
    event = OrderEvent(
        id=str(uuid.uuid4()),
        order_id=order_id,
        event_type=event_type,
        old_value=old_value,
        new_value=new_value,
        actor_type=actor_type,
        actor_id=actor_id,
        note=note,
    )
    db.add(event)
    return event
