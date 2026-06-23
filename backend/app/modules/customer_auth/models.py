import uuid
from datetime import datetime, timezone
from typing import Optional, List
from sqlalchemy import String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base
from app.shared.enums import CustomerStatus, CustomerTokenType


class Customer(Base):
    __tablename__ = "customers"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String, nullable=False)

    full_name: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    phone: Mapped[Optional[str]] = mapped_column(String, nullable=True)

    status: Mapped[str] = mapped_column(String, nullable=False, default=CustomerStatus.ACTIVE)
    is_email_verified: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    last_login_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    marketing_opt_in: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    marketing_opt_in_updated_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    tokens: Mapped[List["CustomerAuthToken"]] = relationship(
        "CustomerAuthToken", back_populates="customer", lazy="noload"
    )
    addresses: Mapped[List["CustomerAddress"]] = relationship(
        "CustomerAddress", back_populates="customer", lazy="noload"
    )


class CustomerAuthToken(Base):
    __tablename__ = "customer_auth_tokens"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    customer_id: Mapped[str] = mapped_column(String, ForeignKey("customers.id"), nullable=False)

    token_type: Mapped[str] = mapped_column(String, nullable=False)
    token_hash: Mapped[str] = mapped_column(String, nullable=False)

    expires_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    used_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    revoked_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    customer: Mapped["Customer"] = relationship("Customer", back_populates="tokens")
