from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class ProfileOut(BaseModel):
    id: str
    email: str
    fullName: Optional[str]
    phone: Optional[str]
    isEmailVerified: bool
    createdAt: datetime


class UpdateProfileRequest(BaseModel):
    fullName: Optional[str] = None
    phone: Optional[str] = None


class AddressOut(BaseModel):
    id: str
    recipientName: str
    phone: str
    provinceCode: Optional[str]
    districtCode: Optional[str]
    wardCode: Optional[str]
    fullAddress: str
    isDefault: bool
    createdAt: datetime


class CreateAddressRequest(BaseModel):
    recipientName: str
    phone: str
    provinceCode: Optional[str] = None
    districtCode: Optional[str] = None
    wardCode: Optional[str] = None
    fullAddress: str
    isDefault: bool = False


class UpdateAddressRequest(BaseModel):
    recipientName: Optional[str] = None
    phone: Optional[str] = None
    provinceCode: Optional[str] = None
    districtCode: Optional[str] = None
    wardCode: Optional[str] = None
    fullAddress: Optional[str] = None
    isDefault: Optional[bool] = None
