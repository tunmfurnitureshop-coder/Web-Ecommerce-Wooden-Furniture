import uuid
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, func

from app.core.exceptions import AppException
from app.modules.customer.models import CustomerAddress
from app.modules.customer.schemas import (
    ProfileOut, UpdateProfileRequest,
    AddressOut, CreateAddressRequest, UpdateAddressRequest,
)
from app.modules.customer_auth.models import Customer


def _address_to_out(a: CustomerAddress) -> AddressOut:
    return AddressOut(
        id=a.id,
        recipientName=a.recipient_name,
        phone=a.phone,
        provinceCode=a.province_code,
        districtCode=a.district_code,
        wardCode=a.ward_code,
        fullAddress=a.full_address,
        isDefault=a.is_default,
        createdAt=a.created_at,
    )


def get_profile(customer: Customer) -> ProfileOut:
    return ProfileOut(
        id=customer.id,
        email=customer.email,
        fullName=customer.full_name,
        phone=customer.phone,
        isEmailVerified=customer.is_email_verified,
        marketingOptIn=customer.marketing_opt_in,
        createdAt=customer.created_at,
    )


async def update_profile(
    db: AsyncSession, customer: Customer, body: UpdateProfileRequest
) -> ProfileOut:
    from datetime import datetime, timezone
    if body.fullName is not None:
        customer.full_name = body.fullName
    if body.phone is not None:
        customer.phone = body.phone
    if body.marketingOptIn is not None and body.marketingOptIn != customer.marketing_opt_in:
        customer.marketing_opt_in = body.marketingOptIn
        customer.marketing_opt_in_updated_at = datetime.now(timezone.utc)
    return get_profile(customer)


async def list_addresses(db: AsyncSession, customer_id: str) -> list[AddressOut]:
    result = await db.execute(
        select(CustomerAddress)
        .where(CustomerAddress.customer_id == customer_id)
        .order_by(CustomerAddress.created_at.asc())
    )
    return [_address_to_out(a) for a in result.scalars().all()]


async def create_address(
    db: AsyncSession, customer_id: str, body: CreateAddressRequest
) -> AddressOut:
    count_result = await db.execute(
        select(func.count()).where(CustomerAddress.customer_id == customer_id)
    )
    is_first = count_result.scalar_one() == 0
    should_be_default = body.isDefault or is_first

    if should_be_default:
        await db.execute(
            update(CustomerAddress)
            .where(CustomerAddress.customer_id == customer_id)
            .values(is_default=False)
        )

    address = CustomerAddress(
        id=str(uuid.uuid4()),
        customer_id=customer_id,
        recipient_name=body.recipientName,
        phone=body.phone,
        province_code=body.provinceCode,
        district_code=body.districtCode,
        ward_code=body.wardCode,
        full_address=body.fullAddress,
        is_default=should_be_default,
    )
    db.add(address)
    await db.flush()
    return _address_to_out(address)


async def _get_owned_address(
    db: AsyncSession, customer_id: str, address_id: str
) -> CustomerAddress:
    result = await db.execute(
        select(CustomerAddress).where(
            CustomerAddress.id == address_id,
            CustomerAddress.customer_id == customer_id,
        )
    )
    address = result.scalar_one_or_none()
    if not address:
        raise AppException(404, "ADDRESS_NOT_FOUND", "Address not found.")
    return address


async def update_address(
    db: AsyncSession, customer_id: str, address_id: str, body: UpdateAddressRequest
) -> AddressOut:
    address = await _get_owned_address(db, customer_id, address_id)

    if body.recipientName is not None:
        address.recipient_name = body.recipientName
    if body.phone is not None:
        address.phone = body.phone
    if body.provinceCode is not None:
        address.province_code = body.provinceCode
    if body.districtCode is not None:
        address.district_code = body.districtCode
    if body.wardCode is not None:
        address.ward_code = body.wardCode
    if body.fullAddress is not None:
        address.full_address = body.fullAddress
    if body.isDefault is True:
        await db.execute(
            update(CustomerAddress)
            .where(CustomerAddress.customer_id == customer_id)
            .values(is_default=False)
        )
        address.is_default = True

    return _address_to_out(address)


async def delete_address(
    db: AsyncSession, customer_id: str, address_id: str
) -> None:
    address = await _get_owned_address(db, customer_id, address_id)
    was_default = address.is_default
    await db.delete(address)
    await db.flush()

    if was_default:
        oldest = (await db.execute(
            select(CustomerAddress)
            .where(CustomerAddress.customer_id == customer_id)
            .order_by(CustomerAddress.created_at.asc())
            .limit(1)
        )).scalar_one_or_none()
        if oldest:
            oldest.is_default = True


async def set_default_address(
    db: AsyncSession, customer_id: str, address_id: str
) -> AddressOut:
    address = await _get_owned_address(db, customer_id, address_id)
    await db.execute(
        update(CustomerAddress)
        .where(CustomerAddress.customer_id == customer_id)
        .values(is_default=False)
    )
    await db.execute(
        update(CustomerAddress)
        .where(
            CustomerAddress.id == address_id,
            CustomerAddress.customer_id == customer_id,
        )
        .values(is_default=True)
    )
    await db.refresh(address)
    return _address_to_out(address)
