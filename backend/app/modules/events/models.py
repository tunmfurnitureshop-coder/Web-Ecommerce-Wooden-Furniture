import uuid
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import String, JSON, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base


def _now() -> datetime:
    return datetime.now(timezone.utc)


class CommerceEvent(Base):
    __tablename__ = "commerce_events"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    event_name: Mapped[str] = mapped_column(String, nullable=False)
    event_source: Mapped[str] = mapped_column(String, nullable=False)
    customer_id: Mapped[Optional[str]] = mapped_column(String, ForeignKey("customers.id", ondelete="SET NULL"), nullable=True)
    anonymous_id: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    session_id: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    product_id: Mapped[Optional[str]] = mapped_column(String, ForeignKey("products.id", ondelete="SET NULL"), nullable=True)
    order_id: Mapped[Optional[str]] = mapped_column(String, ForeignKey("orders.id", ondelete="SET NULL"), nullable=True)
    promotion_id: Mapped[Optional[str]] = mapped_column(String, ForeignKey("promotions.id", ondelete="SET NULL"), nullable=True)
    campaign_id: Mapped[Optional[str]] = mapped_column(String, ForeignKey("campaigns.id", ondelete="SET NULL"), nullable=True)
    locale: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    source_page: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    referrer: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    payload: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    occurred_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=_now)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)
