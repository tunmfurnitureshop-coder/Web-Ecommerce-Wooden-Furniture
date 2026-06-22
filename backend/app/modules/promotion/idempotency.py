import hashlib
import json
import uuid
from datetime import datetime, timezone, timedelta
from typing import Optional
from sqlalchemy import String, Integer, DateTime, JSON, UniqueConstraint, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import Base


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _expires() -> datetime:
    return datetime.now(timezone.utc) + timedelta(hours=24)


class IdempotencyKey(Base):
    __tablename__ = "idempotency_keys"
    __table_args__ = (UniqueConstraint("scope", "idempotency_key", name="uq_idempotency_scope_key"),)

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    scope: Mapped[str] = mapped_column(String, nullable=False)
    idempotency_key: Mapped[str] = mapped_column(String, nullable=False)
    request_hash: Mapped[str] = mapped_column(String, nullable=False)
    customer_id: Mapped[Optional[str]] = mapped_column(String, ForeignKey("customers.id", ondelete="SET NULL"), nullable=True)
    anonymous_id: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    resource_id: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    response_status_code: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    response_body: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    status: Mapped[str] = mapped_column(String, nullable=False, default="PROCESSING")
    expires_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=_expires)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=_now, onupdate=_now)


def hash_request(body: dict) -> str:
    return hashlib.sha256(json.dumps(body, sort_keys=True, default=str).encode()).hexdigest()


async def get_or_create(
    db: AsyncSession,
    scope: str,
    key: str,
    request_hash: str,
    customer_id: Optional[str] = None,
) -> tuple["IdempotencyKey", bool]:
    existing = (await db.execute(
        select(IdempotencyKey).where(
            IdempotencyKey.scope == scope,
            IdempotencyKey.idempotency_key == key,
        )
    )).scalar_one_or_none()
    if existing:
        return existing, False
    record = IdempotencyKey(
        scope=scope,
        idempotency_key=key,
        request_hash=request_hash,
        customer_id=customer_id,
    )
    db.add(record)
    await db.flush()
    return record, True


async def complete(db: AsyncSession, record: "IdempotencyKey", response_body: dict, status_code: int = 200):
    record.response_body = response_body
    record.response_status_code = status_code
    record.status = "DONE"
