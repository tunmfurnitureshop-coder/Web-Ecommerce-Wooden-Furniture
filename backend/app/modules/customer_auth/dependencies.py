from fastapi import Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import decode_token
from app.core.exceptions import unauthorized
from app.modules.customer_auth.models import Customer
from app.shared.enums import CustomerStatus

bearer_scheme = HTTPBearer(auto_error=False)


async def require_customer(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db),
) -> Customer:
    if not credentials:
        raise unauthorized()

    payload = decode_token(credentials.credentials)
    if not payload or payload.get("role") != "customer":
        raise unauthorized()

    customer = await db.get(Customer, payload["sub"])
    if not customer or customer.status == CustomerStatus.BLOCKED:
        raise unauthorized()

    return customer


async def optional_customer(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db),
) -> Customer | None:
    """Returns customer if valid token present, None otherwise."""
    if not credentials:
        return None
    payload = decode_token(credentials.credentials)
    if not payload or payload.get("role") != "customer":
        return None
    customer = await db.get(Customer, payload["sub"])
    if not customer or customer.status == CustomerStatus.BLOCKED:
        return None
    return customer
