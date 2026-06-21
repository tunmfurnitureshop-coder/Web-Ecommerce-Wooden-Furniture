from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.modules.auth.dependencies import require_admin
from app.modules.customer_auth.dependencies import require_customer
from app.modules.customer_auth.models import Customer
from app.modules.review import service
from app.modules.review.schemas import (
    ReviewSubmitRequest,
    ReviewUpdateRequest,
    ReviewOut,
    ProductReviewsResponse,
    AdminReviewListResponse,
    AdminReviewOut,
    AdminUpdateReviewStatusRequest,
)

router = APIRouter(tags=["reviews"])
admin_router = APIRouter(tags=["admin-reviews"])


@router.post("/products/{product_id}/reviews", status_code=201)
async def submit_review(
    product_id: str,
    body: ReviewSubmitRequest,
    customer: Customer = Depends(require_customer),
    db: AsyncSession = Depends(get_db),
):
    result = await service.submit_review(db, customer, product_id, body)
    await db.commit()
    return result


@router.get("/products/{product_id}/reviews", response_model=ProductReviewsResponse)
async def list_product_reviews(
    product_id: str,
    page: int = Query(1, ge=1),
    pageSize: int = Query(10, ge=1, le=50),
    sort: str = Query("newest"),
    db: AsyncSession = Depends(get_db),
):
    return await service.list_product_reviews(db, product_id, page, pageSize, sort)


@router.patch("/customer/reviews/{review_id}", response_model=ReviewOut)
async def update_review(
    review_id: str,
    body: ReviewUpdateRequest,
    customer: Customer = Depends(require_customer),
    db: AsyncSession = Depends(get_db),
):
    result = await service.update_review(db, customer, review_id, body)
    await db.commit()
    return result


@router.delete("/customer/reviews/{review_id}", status_code=204)
async def delete_review(
    review_id: str,
    customer: Customer = Depends(require_customer),
    db: AsyncSession = Depends(get_db),
):
    await service.delete_review(db, customer.id, review_id)
    await db.commit()


@admin_router.get("/reviews", response_model=AdminReviewListResponse)
async def admin_list_reviews(
    status: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    pageSize: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(require_admin),
):
    return await service.admin_list_reviews(db, status, page, pageSize)


@admin_router.patch("/reviews/{review_id}/status", response_model=AdminReviewOut)
async def admin_update_review_status(
    review_id: str,
    body: AdminUpdateReviewStatusRequest,
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(require_admin),
):
    result = await service.admin_update_review_status(db, review_id, body)
    await db.commit()
    return result
