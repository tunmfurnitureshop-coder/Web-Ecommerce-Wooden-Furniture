import uuid
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import func, case, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError

from app.core.exceptions import not_found, conflict, forbidden, validation_error
from app.modules.customer_auth.models import Customer
from app.modules.order.models import Order, OrderItem
from app.modules.review.models import ProductReview
from app.modules.review.schemas import (
    ReviewSubmitRequest,
    ReviewUpdateRequest,
    ReviewOut,
    ReviewSummaryOut,
    ProductReviewsResponse,
    AdminReviewOut,
    AdminReviewListResponse,
    AdminUpdateReviewStatusRequest,
)
from app.shared.enums import OrderStatus, ReviewStatus


def _mask_name(full_name: str) -> str:
    parts = full_name.strip().split()
    if len(parts) <= 1:
        return full_name
    abbrevs = " ".join(p[0] + "." for p in parts[1:])
    return f"{parts[0]} {abbrevs}"


def _review_to_out(review: ProductReview, customer: Customer) -> ReviewOut:
    return ReviewOut(
        id=review.id,
        customerName=_mask_name(customer.full_name or customer.email.split("@")[0]),
        rating=review.rating,
        title=review.title,
        content=review.content,
        isVerifiedPurchase=review.is_verified_purchase,
        createdAt=review.created_at,
    )


async def _check_eligibility(db: AsyncSession, customer_id: str, product_id: str) -> Optional[OrderItem]:
    result = await db.execute(
        select(OrderItem)
        .join(Order, Order.id == OrderItem.order_id)
        .where(
            Order.customer_id == customer_id,
            Order.order_status == OrderStatus.DELIVERED,
            OrderItem.product_id == product_id,
        )
        .limit(1)
    )
    return result.scalar_one_or_none()


async def _get_own_review(db: AsyncSession, customer_id: str, review_id: str) -> ProductReview:
    review = (await db.execute(
        select(ProductReview).where(
            ProductReview.id == review_id,
            ProductReview.customer_id == customer_id,
        )
    )).scalar_one_or_none()
    if not review:
        raise not_found("Review")
    return review


async def submit_review(
    db: AsyncSession, customer: Customer, product_id: str, body: ReviewSubmitRequest
) -> dict:
    order_item = await _check_eligibility(db, customer.id, product_id)
    if not order_item:
        raise forbidden()

    review = ProductReview(
        id=str(uuid.uuid4()),
        product_id=product_id,
        customer_id=customer.id,
        order_item_id=order_item.id,
        rating=body.rating,
        title=body.title,
        content=body.content,
        status=ReviewStatus.PENDING,
        is_verified_purchase=True,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    db.add(review)
    try:
        await db.flush()
    except IntegrityError:
        await db.rollback()
        raise conflict("ALREADY_REVIEWED", "You have already reviewed this product.")
    return {"id": review.id, "status": review.status, "message": "Review submitted and is awaiting moderation."}


async def list_product_reviews(
    db: AsyncSession, product_id: str, page: int = 1, page_size: int = 10, sort: str = "newest"
) -> ProductReviewsResponse:
    summary_row = (await db.execute(
        select(
            func.avg(ProductReview.rating).label("avg_rating"),
            func.count(ProductReview.id).label("count"),
            func.sum(case((ProductReview.rating == 5, 1), else_=0)).label("five"),
            func.sum(case((ProductReview.rating == 4, 1), else_=0)).label("four"),
            func.sum(case((ProductReview.rating == 3, 1), else_=0)).label("three"),
            func.sum(case((ProductReview.rating == 2, 1), else_=0)).label("two"),
            func.sum(case((ProductReview.rating == 1, 1), else_=0)).label("one"),
        ).where(
            ProductReview.product_id == product_id,
            ProductReview.status == ReviewStatus.APPROVED,
        )
    )).one()

    summary = ReviewSummaryOut(
        averageRating=round(float(summary_row.avg_rating or 0), 1),
        reviewCount=summary_row.count or 0,
        distribution={
            "5": summary_row.five or 0,
            "4": summary_row.four or 0,
            "3": summary_row.three or 0,
            "2": summary_row.two or 0,
            "1": summary_row.one or 0,
        },
    )

    order_col = ProductReview.created_at.desc() if sort == "newest" else ProductReview.rating.desc()
    offset = (page - 1) * page_size

    rows = (await db.execute(
        select(ProductReview, Customer)
        .join(Customer, Customer.id == ProductReview.customer_id)
        .where(
            ProductReview.product_id == product_id,
            ProductReview.status == ReviewStatus.APPROVED,
        )
        .order_by(order_col)
        .offset(offset)
        .limit(page_size)
    )).all()

    items = [_review_to_out(review, customer) for review, customer in rows]

    return ProductReviewsResponse(
        summary=summary,
        items=items,
        page=page,
        pageSize=page_size,
    )


async def update_review(
    db: AsyncSession, customer: Customer, review_id: str, body: ReviewUpdateRequest
) -> ReviewOut:
    review = await _get_own_review(db, customer.id, review_id)

    if body.rating is not None:
        review.rating = body.rating
    if body.title is not None:
        review.title = body.title
    if body.content is not None:
        review.content = body.content

    if review.status == ReviewStatus.APPROVED:
        review.status = ReviewStatus.PENDING

    review.updated_at = datetime.now(timezone.utc)
    await db.flush()
    return _review_to_out(review, customer)


async def delete_review(db: AsyncSession, customer_id: str, review_id: str) -> None:
    review = await _get_own_review(db, customer_id, review_id)
    await db.delete(review)


VALID_ADMIN_TRANSITIONS: dict[ReviewStatus, list[ReviewStatus]] = {
    ReviewStatus.PENDING: [ReviewStatus.APPROVED, ReviewStatus.REJECTED],
    ReviewStatus.APPROVED: [ReviewStatus.HIDDEN],
    ReviewStatus.HIDDEN: [ReviewStatus.APPROVED],
}


async def admin_list_reviews(
    db: AsyncSession,
    status: Optional[str] = None,
    page: int = 1,
    page_size: int = 20,
) -> AdminReviewListResponse:
    base_query = select(ProductReview, Customer).join(Customer, Customer.id == ProductReview.customer_id)
    if status:
        base_query = base_query.where(ProductReview.status == status)

    total_row = (await db.execute(
        select(func.count()).select_from(base_query.subquery())
    )).scalar_one()

    offset = (page - 1) * page_size
    rows = (await db.execute(
        base_query.order_by(ProductReview.created_at.desc()).offset(offset).limit(page_size)
    )).all()

    items = [
        AdminReviewOut(
            id=review.id,
            productId=review.product_id,
            customerId=review.customer_id,
            customerEmail=customer.email,
            customerName=customer.full_name or customer.email.split("@")[0],
            rating=review.rating,
            title=review.title,
            content=review.content,
            status=review.status,
            isVerifiedPurchase=review.is_verified_purchase,
            createdAt=review.created_at,
        )
        for review, customer in rows
    ]

    return AdminReviewListResponse(items=items, total=total_row, page=page, pageSize=page_size)


async def admin_update_review_status(
    db: AsyncSession, review_id: str, body: AdminUpdateReviewStatusRequest
) -> AdminReviewOut:
    result = (await db.execute(
        select(ProductReview, Customer)
        .join(Customer, Customer.id == ProductReview.customer_id)
        .where(ProductReview.id == review_id)
    )).one_or_none()

    if not result:
        raise not_found("Review")

    review, customer = result

    try:
        new_status = ReviewStatus(body.status)
    except ValueError:
        raise validation_error(f"Invalid status value: {body.status}")

    allowed = VALID_ADMIN_TRANSITIONS.get(ReviewStatus(review.status), [])
    if new_status not in allowed:
        raise validation_error(
            "INVALID_STATUS_TRANSITION",
            {"from": review.status, "to": body.status, "allowed": [s.value for s in allowed]},
        )

    review.status = new_status
    review.updated_at = datetime.now(timezone.utc)
    await db.flush()

    return AdminReviewOut(
        id=review.id,
        productId=review.product_id,
        customerId=review.customer_id,
        customerEmail=customer.email,
        customerName=customer.full_name or customer.email.split("@")[0],
        rating=review.rating,
        title=review.title,
        content=review.content,
        status=review.status,
        isVerifiedPurchase=review.is_verified_purchase,
        createdAt=review.created_at,
    )
