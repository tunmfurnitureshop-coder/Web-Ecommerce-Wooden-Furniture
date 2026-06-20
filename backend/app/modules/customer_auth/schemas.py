from typing import Optional
from pydantic import BaseModel, EmailStr


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    fullName: Optional[str] = None
    phone: Optional[str] = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class CustomerPublicOut(BaseModel):
    id: str
    email: str
    fullName: Optional[str]
    phone: Optional[str]
    isEmailVerified: bool


class RegisterResponse(BaseModel):
    customer: CustomerPublicOut
    message: str


class TokenResponse(BaseModel):
    accessToken: str
    tokenType: str = "bearer"
    customer: CustomerPublicOut


class RefreshTokenResponse(BaseModel):
    accessToken: str
    tokenType: str = "bearer"
