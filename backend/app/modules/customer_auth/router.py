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
    VerifyEmailRequest, ForgotPasswordRequest, ResetPasswordRequest, MessageResponse,
)
from app.modules.customer_auth.service import (
    _create_customer_access_token, _customer_to_out, create_one_time_token,
)
from app.modules.notification.service import (
    send_verification_email, send_password_reset_email, send_password_changed_email,
)
from app.shared.enums import CustomerTokenType

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
    raw_token = await create_one_time_token(
        db, customer.id, CustomerTokenType.EMAIL_VERIFICATION,
        settings.EMAIL_VERIFICATION_EXPIRE_HOURS,
    )
    verification_url = f"{settings.FRONTEND_BASE_URL}/vi/verify-email?token={raw_token}"
    try:
        await send_verification_email(db, customer, verification_url)
    except Exception:
        pass
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


@router.post("/verify-email", response_model=MessageResponse)
async def verify_email(body: VerifyEmailRequest, db: AsyncSession = Depends(get_db)):
    await service.verify_email(db, body.token)
    await db.commit()
    return MessageResponse(message="Email verified successfully.")


@router.post("/forgot-password", response_model=MessageResponse)
async def forgot_password(body: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)):
    result = await service.forgot_password(db, body.email)
    if result:
        customer, raw_token = result
        reset_url = f"{settings.FRONTEND_BASE_URL}/vi/reset-password?token={raw_token}"
        try:
            await send_password_reset_email(db, customer, reset_url)
        except Exception:
            pass
        await db.commit()
    return MessageResponse(
        message="If the email exists, password reset instructions have been sent."
    )


@router.post("/reset-password", response_model=MessageResponse)
async def reset_password(body: ResetPasswordRequest, db: AsyncSession = Depends(get_db)):
    customer = await service.reset_password(db, body.token, body.newPassword)
    try:
        await send_password_changed_email(db, customer)
    except Exception:
        pass
    await db.commit()
    return MessageResponse(message="Password has been reset successfully.")
