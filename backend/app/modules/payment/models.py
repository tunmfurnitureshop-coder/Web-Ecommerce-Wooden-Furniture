import uuid
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import String, Integer, Text, DateTime, ForeignKey, CheckConstraint, Index, JSON
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base


class PaymentTransaction(Base):
    __tablename__ = "payment_transactions"
    __table_args__ = (
        CheckConstraint("amount_vnd >= 0", name="ck_payment_transactions_amount"),
        Index("idx_payment_transactions_order_id", "order_id"),
        Index("idx_payment_transactions_provider_order_code", "provider_order_code"),
        Index("idx_payment_transactions_provider_payment_link_id", "provider_payment_link_id"),
    )

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    order_id: Mapped[str] = mapped_column(String, ForeignKey("orders.id"), nullable=False)

    provider: Mapped[str] = mapped_column(String, nullable=False)
    status: Mapped[str] = mapped_column(String, nullable=False)

    amount_vnd: Mapped[int] = mapped_column(Integer, nullable=False)
    currency: Mapped[str] = mapped_column(String, default="VND")

    provider_transaction_id: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    provider_payment_link_id: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    provider_order_code: Mapped[Optional[str]] = mapped_column(String, nullable=True)

    checkout_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    qr_code: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    raw_request: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    raw_response: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)

    paid_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    cancelled_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    expired_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
