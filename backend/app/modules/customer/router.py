from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.modules.customer import service
from app.modules.customer.schemas import (
    ProfileOut, UpdateProfileRequest,
    AddressOut, CreateAddressRequest, UpdateAddressRequest,
)
from app.modules.customer_auth.dependencies import require_customer
from app.modules.customer_auth.models import Customer

router = APIRouter(prefix="/customer", tags=["customer"])


@router.get("/me", response_model=ProfileOut)
async def get_me(customer: Customer = Depends(require_customer)):
    return service.get_profile(customer)


@router.patch("/me", response_model=ProfileOut)
async def update_me(
    body: UpdateProfileRequest,
    customer: Customer = Depends(require_customer),
    db: AsyncSession = Depends(get_db),
):
    profile = await service.update_profile(db, customer, body)
    await db.commit()
    return profile


@router.get("/addresses", response_model=list[AddressOut])
async def list_addresses(
    customer: Customer = Depends(require_customer),
    db: AsyncSession = Depends(get_db),
):
    return await service.list_addresses(db, customer.id)


@router.post("/addresses", response_model=AddressOut, status_code=201)
async def create_address(
    body: CreateAddressRequest,
    customer: Customer = Depends(require_customer),
    db: AsyncSession = Depends(get_db),
):
    address = await service.create_address(db, customer.id, body)
    await db.commit()
    return address


@router.patch("/addresses/{address_id}", response_model=AddressOut)
async def update_address(
    address_id: str,
    body: UpdateAddressRequest,
    customer: Customer = Depends(require_customer),
    db: AsyncSession = Depends(get_db),
):
    address = await service.update_address(db, customer.id, address_id, body)
    await db.commit()
    return address


@router.delete("/addresses/{address_id}", status_code=204)
async def delete_address(
    address_id: str,
    customer: Customer = Depends(require_customer),
    db: AsyncSession = Depends(get_db),
):
    await service.delete_address(db, customer.id, address_id)
    await db.commit()


@router.post("/addresses/{address_id}/set-default", response_model=AddressOut)
async def set_default(
    address_id: str,
    customer: Customer = Depends(require_customer),
    db: AsyncSession = Depends(get_db),
):
    address = await service.set_default_address(db, customer.id, address_id)
    await db.commit()
    return address
