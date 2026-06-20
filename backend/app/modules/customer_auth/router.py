from fastapi import APIRouter, Depends, Request, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.core.exceptions import unauthorized
from app.modules.customer_auth import service
from app.modules.customer_auth.dependencies import require_customer
from app.modules.customer_auth.models import Customer
from app.modules.customer_auth.schemas import (
    RegisterRequest, LoginRequest,
    RegisterResponse, TokenResponse, RefreshTokenResponse,
)
from app.modules.customer_auth.service import _create_customer_access_token, _customer_to_out

router = APIRouter(prefix="/customer/auth", tags=["customer-auth"])

_COOKIE_PATH = "/api/v1/customer/auth"


def _set_refresh_cookie(response: Response, raw_token: str) -> None:
    response.set_cookie(
        key=settings.REFRESH_TOKEN_COOKIE_NAME,
        value=raw_token,
        httponly=True,
        samesite="lax",
        secure=settings.ENV == "production",
        max_age=settings.CUSTOMER_REFRESH_TOKEN_EXPIRE_DAYS * 86400,
        path=_COOKIE_PATH,
    )


def _clear_refresh_cookie(response: Response) -> None:
    response.delete_cookie(
        key=settings.REFRESH_TOKEN_COOKIE_NAME,
        path=_COOKIE_PATH,
    )


@router.post("/register", response_model=RegisterResponse, status_code=201)
async def register(body: RegisterRequest, db: AsyncSession = Depends(get_db)):
    customer = await service.register_customer(db, body)
    await db.commit()
    return RegisterResponse(
        customer=_customer_to_out(customer),
        message="Registration successful. Please verify your email.",
    )


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest, response: Response, db: AsyncSession = Depends(get_db)):
    customer, raw_refresh = await service.login_customer(db, body)
    await db.commit()
    _set_refresh_cookie(response, raw_refresh)
    return TokenResponse(
        accessToken=_create_customer_access_token(customer),
        customer=_customer_to_out(customer),
    )


@router.post("/refresh", response_model=RefreshTokenResponse)
async def refresh(request: Request, db: AsyncSession = Depends(get_db)):
    raw_token = request.cookies.get(settings.REFRESH_TOKEN_COOKIE_NAME)
    if not raw_token:
        raise unauthorized()
    _, access_token = await service.refresh_access_token(db, raw_token)
    return RefreshTokenResponse(accessToken=access_token)


@router.post("/logout", status_code=204)
async def logout(
    request: Request,
    response: Response,
    customer: Customer = Depends(require_customer),
    db: AsyncSession = Depends(get_db),
):
    raw_token = request.cookies.get(settings.REFRESH_TOKEN_COOKIE_NAME)
    await service.logout_customer(db, customer.id, raw_token)
    await db.commit()
    _clear_refresh_cookie(response)
