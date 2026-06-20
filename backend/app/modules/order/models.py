import uuid
from datetime import datetime, timezone
from typing import Optional, List
from sqlalchemy import String, Integer, Text, DateTime, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base
from app.shared.enums import OrderStatus, PaymentStatus, PaymentMethod


class Order(Base):
    __tablename__ = "orders"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    order_code: Mapped[str] = mapped_column(String, unique=True, nullable=False)

    customer_name: Mapped[str] = mapped_column(String, nullable=False)
    customer_phone: Mapped[str] = mapped_column(String, nullable=False)
    customer_email: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    shipping_address: Mapped[str] = mapped_column(Text, nullable=False)
    note: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    subtotal_vnd: Mapped[int] = mapped_column(Integer, nullable=False)
    shipping_fee_vnd: Mapped[int] = mapped_column(Integer, default=0)
    total_vnd: Mapped[int] = mapped_column(Integer, nullable=False)
    currency: Mapped[str] = mapped_column(String, default="VND")

    order_status: Mapped[str] = mapped_column(String, nullable=False)
    payment_status: Mapped[str] = mapped_column(String, nullable=False)
    payment_method: Mapped[str] = mapped_column(String, nullable=False)

    payment_provider: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    latest_payment_transaction_id: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    payment_completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    customer_id: Mapped[Optional[str]] = mapped_column(String, ForeignKey("customers.id"), nullable=True)
    guest_email: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    guest_order_claim_token_hash: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    guest_order_claimed_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    items: Mapped[List["OrderItem"]] = relationship("OrderItem", back_populates="order", lazy="selectin")


class OrderItem(Base):
    __tablename__ = "order_items"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    order_id: Mapped[str] = mapped_column(String, ForeignKey("orders.id"), nullable=False)
    product_id: Mapped[str] = mapped_column(String, ForeignKey("products.id"), nullable=False)

    product_name_snapshot: Mapped[str] = mapped_column(String, nullable=False)
    product_sku_snapshot: Mapped[str] = mapped_column(String, nullable=False)

    selected_options_snapshot: Mapped[dict] = mapped_column(JSON, nullable=False)
    unit_price_vnd: Mapped[int] = mapped_column(Integer, nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    line_total_vnd: Mapped[int] = mapped_column(Integer, nullable=False)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    order: Mapped["Order"] = relationship("Order", back_populates="items")
