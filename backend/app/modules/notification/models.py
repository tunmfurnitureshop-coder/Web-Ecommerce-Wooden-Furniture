import uuid
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import String, Text, DateTime, ForeignKey, Index, JSON
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base


class EmailLog(Base):
    __tablename__ = "email_logs"
    __table_args__ = (
        Index("idx_email_logs_order_id", "related_order_id"),
        Index("idx_email_logs_status", "status"),
        Index("idx_email_logs_created_at", "created_at"),
    )

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))

    provider: Mapped[str] = mapped_column(String, nullable=False)
    recipient_email: Mapped[str] = mapped_column(String, nullable=False)
    subject: Mapped[str] = mapped_column(String, nullable=False)
    template_key: Mapped[str] = mapped_column(String, nullable=False)

    status: Mapped[str] = mapped_column(String, nullable=False)
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    related_order_id: Mapped[Optional[str]] = mapped_column(String, ForeignKey("orders.id"), nullable=True)
    related_payment_transaction_id: Mapped[Optional[str]] = mapped_column(String, nullable=True)

    raw_payload: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)

    sent_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
