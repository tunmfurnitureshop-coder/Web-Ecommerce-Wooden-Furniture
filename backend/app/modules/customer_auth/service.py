import re
import uuid
import secrets
import hashlib
from datetime import datetime, timezone, timedelta
from typing import Optional, Tuple

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update

from app.core.config import settings
from app.core.security import hash_password, verify_password, create_access_token
from app.core.exceptions import conflict, unauthorized, AppException
from app.modules.customer_auth.models import Customer, CustomerAuthToken
from app.modules.customer_auth.schemas import RegisterRequest, LoginRequest, CustomerPublicOut
from app.shared.enums import CustomerStatus, CustomerTokenType


def _validate_password(password: str) -> None:
    if len(password) < 8:
        raise AppException(422, "WEAK_PASSWORD", "Password must be at least 8 characters.")
    if not re.search(r"[A-Z]", password):
        raise AppException(422, "WEAK_PASSWORD", "Password must contain at least one uppercase letter.")
    if not re.search(r"[a-z]", password):
        raise AppException(422, "WEAK_PASSWORD", "Password must contain at least one lowercase letter.")
    if not re.search(r"\d", password):
        raise AppException(422, "WEAK_PASSWORD", "Password must contain at least one digit.")


def _hash_token(raw: str) -> str:
    return hashlib.sha256(raw.encode()).hexdigest()


def _customer_to_out(customer: Customer) -> CustomerPublicOut:
    return CustomerPublicOut(
        id=customer.id,
        email=customer.email,
        fullName=customer.full_name,
        phone=customer.phone,
        isEmailVerified=customer.is_email_verified,
    )


def _create_customer_access_token(customer: Customer) -> str:
    return create_access_token(
        {"sub": customer.id, "role": "customer", "email": customer.email},
        expires_delta=timedelta(minutes=settings.CUSTOMER_JWT_EXPIRE_MINUTES),
    )


async def _find_by_email(db: AsyncSession, email: str) -> Optional[Customer]:
    result = await db.execute(
        select(Customer).where(Customer.email == email.lower())
    )
    return result.scalar_one_or_none()


async def register_customer(db: AsyncSession, body: RegisterRequest) -> Customer:
    _validate_password(body.password)

    existing = await _find_by_email(db, body.email)
    if existing:
        raise conflict("EMAIL_TAKEN", "An account with this email already exists.")

    customer = Customer(
        id=str(uuid.uuid4()),
        email=body.email.lower(),
        password_hash=hash_password(body.password),
        full_name=body.fullName,
        phone=body.phone,
        status=CustomerStatus.ACTIVE,
        is_email_verified=False,
    )
    db.add(customer)
    await db.flush()
    return customer


async def create_refresh_token(db: AsyncSession, customer_id: str) -> str:
    raw = secrets.token_urlsafe(64)
    token_hash = _hash_token(raw)
    token = CustomerAuthToken(
        id=str(uuid.uuid4()),
        customer_id=customer_id,
        token_type=CustomerTokenType.REFRESH,
        token_hash=token_hash,
        expires_at=datetime.now(timezone.utc) + timedelta(days=settings.CUSTOMER_REFRESH_TOKEN_EXPIRE_DAYS),
    )
    db.add(token)
    return raw


async def login_customer(db: AsyncSession, body: LoginRequest) -> Tuple[Customer, str]:
    customer = await _find_by_email(db, body.email)
    if not customer or not verify_password(body.password, customer.password_hash):
        raise unauthorized()
    if customer.status == CustomerStatus.BLOCKED:
        raise AppException(403, "CUSTOMER_BLOCKED", "This account has been blocked.")

    customer.last_login_at = datetime.now(timezone.utc)
    raw_refresh = await create_refresh_token(db, customer.id)
    return customer, raw_refresh


async def refresh_access_token(db: AsyncSession, raw_token: str) -> Tuple[Customer, str]:
    token_hash = _hash_token(raw_token)
    now = datetime.now(timezone.utc)

    result = await db.execute(
        select(CustomerAuthToken).where(
            CustomerAuthToken.token_hash == token_hash,
            CustomerAuthToken.token_type == CustomerTokenType.REFRESH,
            CustomerAuthToken.revoked_at.is_(None),
            CustomerAuthToken.expires_at > now,
        )
    )
    token_row = result.scalar_one_or_none()
    if not token_row:
        raise unauthorized()

    customer = await db.get(Customer, token_row.customer_id)
    if not customer or customer.status == CustomerStatus.BLOCKED:
        raise unauthorized()

    access_token = _create_customer_access_token(customer)
    return customer, access_token


async def logout_customer(db: AsyncSession, customer_id: str, raw_token: Optional[str]) -> None:
    if not raw_token:
        return
    token_hash = _hash_token(raw_token)
    await db.execute(
        update(CustomerAuthToken)
        .where(
            CustomerAuthToken.token_hash == token_hash,
            CustomerAuthToken.customer_id == customer_id,
            CustomerAuthToken.token_type == CustomerTokenType.REFRESH,
            CustomerAuthToken.revoked_at.is_(None),
        )
        .values(revoked_at=datetime.now(timezone.utc))
    )
