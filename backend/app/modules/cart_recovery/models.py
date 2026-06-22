import uuid
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import String, Boolean, Integer, DateTime, JSON, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base


def _now() -> datetime:
    return datetime.now(timezone.utc)


class CartRecoverySession(Base):
    __tablename__ = "cart_recovery_sessions"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    customer_id: Mapped[Optional[str]] = mapped_column(String, ForeignKey("customers.id", ondelete="SET NULL"), nullable=True)
    anonymous_id: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    session_id: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    email: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    email_hash: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    marketing_opt_in: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    locale: Mapped[str] = mapped_column(String, nullable=False, default="vi")
    cart_snapshot: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    cart_value_vnd: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    status: Mapped[str] = mapped_column(String, nullable=False, default="ACTIVE")
    recovery_token_hash: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    recovery_token_expires_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    last_activity_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=_now)
    checkout_started_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    purchased_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    abandoned_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    reminder_sent_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=_now, onupdate=_now)
