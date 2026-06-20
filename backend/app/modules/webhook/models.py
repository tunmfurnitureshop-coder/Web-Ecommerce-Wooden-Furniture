import uuid
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import String, Text, DateTime, Index, JSON
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base


class WebhookEvent(Base):
    __tablename__ = "webhook_events"
    __table_args__ = (
        Index("idx_webhook_provider_external_event", "provider", "external_event_id"),
        Index("idx_webhook_status", "processing_status"),
        Index("idx_webhook_created_at", "created_at"),
    )

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))

    provider: Mapped[str] = mapped_column(String, nullable=False)
    external_event_id: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    event_type: Mapped[Optional[str]] = mapped_column(String, nullable=True)

    signature: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    payload: Mapped[dict] = mapped_column(JSON, nullable=False)

    processing_status: Mapped[str] = mapped_column(String, nullable=False)
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    processed_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
