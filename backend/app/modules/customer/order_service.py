from datetime import datetime, timezone
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from app.core.exceptions import AppException
from app.modules.customer.order_schemas import (
    CustomerOrderListItem, CustomerOrderListResponse,
    CustomerOrderDetailOut, CustomerOrderItemOut, OrderEventOut,
    ReorderResponse, ReorderItemOut, UnavailableItemOut,
)
from app.modules.customer_auth.models import Customer
from app.modules.order.models import Order, OrderItem
from app.modules.order.events import OrderEvent
from app.modules.pricing.service import calculate_quote
from app.modules.pricing.schemas import PricingQuoteRequest, SelectedOptionsIn
from app.modules.product.models import Product
from app.shared.enums import ProductStatus


async def list_customer_orders(
    db: AsyncSession,
    customer_id: str,
    page: int,
    page_size: int,
    status: Optional[str] = None,
) -> CustomerOrderListResponse:
    base = (
        select(Order)
        .where(Order.customer_id == customer_id)
        .options(selectinload(Order.items))
    )
    if status:
        base = base.where(Order.order_status == status)

    total = (await db.execute(
        select(func.count()).select_from(base.subquery())
    )).scalar_one()

    orders = (await db.execute(
        base.order_by(Order.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )).scalars().all()

    first_product_ids = [o.items[0].product_id for o in orders if o.items]
    products_by_id: dict[str, Product] = {}
    if first_product_ids:
        rows = (await db.execute(
            select(Product).where(Product.id.in_(first_product_ids))
        )).scalars().all()
        products_by_id = {p.id: p for p in rows}

    items = []
    for o in orders:
        img = None
        if o.items:
            p = products_by_id.get(o.items[0].product_id)
            img = p.primary_image_url if p else None
        items.append(CustomerOrderListItem(
            orderCode=o.order_code,
            createdAt=o.created_at,
            totalVnd=o.total_vnd,
            paymentStatus=o.payment_status,
            orderStatus=o.order_status,
            itemCount=len(o.items),
            primaryImageUrl=img,
        ))

    return CustomerOrderListResponse(items=items, page=page, pageSize=page_size, total=total)


async def get_customer_order_detail(
    db: AsyncSession, customer_id: str, order_code: str
) -> CustomerOrderDetailOut:
    order = (await db.execute(
        select(Order)
        .where(Order.order_code == order_code)
        .options(selectinload(Order.items))
    )).scalar_one_or_none()

    if not order or order.customer_id != customer_id:
        raise AppException(404, "ORDER_NOT_FOUND", "Order not found.")

    events = (await db.execute(
        select(OrderEvent)
        .where(OrderEvent.order_id == order.id)
        .order_by(OrderEvent.created_at)
    )).scalars().all()

    return CustomerOrderDetailOut(
        orderCode=order.order_code,
        customerName=order.customer_name,
        customerPhone=order.customer_phone,
        customerEmail=order.customer_email,
        shippingAddress=order.shipping_address,
        note=order.note,
        subtotalVnd=order.subtotal_vnd,
        shippingFeeVnd=order.shipping_fee_vnd,
        totalVnd=order.total_vnd,
        orderStatus=order.order_status,
        paymentStatus=order.payment_status,
        paymentMethod=order.payment_method,
        createdAt=order.created_at,
        items=[
            CustomerOrderItemOut(
                productId=i.product_id,
                productNameSnapshot=i.product_name_snapshot,
                productSkuSnapshot=i.product_sku_snapshot,
                selectedOptionsSnapshot=i.selected_options_snapshot,
                unitPriceVnd=i.unit_price_vnd,
                quantity=i.quantity,
                lineTotalVnd=i.line_total_vnd,
            )
            for i in order.items
        ],
        events=[
            OrderEventOut(
                eventType=e.event_type,
                actorType=e.actor_type,
                note=e.note,
                createdAt=e.created_at,
            )
            for e in events
        ],
    )


async def claim_guest_orders(db: AsyncSession, customer: Customer) -> int:
    if not customer.is_email_verified:
        raise AppException(403, "EMAIL_NOT_VERIFIED", "Email must be verified to claim guest orders.")

    result = await db.execute(
        select(Order).where(
            Order.customer_id.is_(None),
            Order.guest_email == customer.email,
            Order.guest_order_claimed_at.is_(None),
        )
    )
    orders = result.scalars().all()
    now = datetime.now(timezone.utc)
    for order in orders:
        order.customer_id = customer.id
        order.guest_order_claimed_at = now
    return len(orders)


async def reorder(
    db: AsyncSession, customer_id: str, order_code: str
) -> ReorderResponse:
    order = (await db.execute(
        select(Order)
        .where(Order.order_code == order_code)
        .options(selectinload(Order.items))
    )).scalar_one_or_none()

    if not order or order.customer_id != customer_id:
        raise AppException(404, "ORDER_NOT_FOUND", "Order not found.")

    available: list[ReorderItemOut] = []
    unavailable: list[UnavailableItemOut] = []

    for item in order.items:
        snapshot = item.selected_options_snapshot
        wood_code = (snapshot.get("woodType") or {}).get("code", "")
        finish_code = (snapshot.get("finish") or {}).get("code", "")
        size_code = (snapshot.get("size") or {}).get("code", "")

        try:
            quote = await calculate_quote(db, PricingQuoteRequest(
                productId=item.product_id,
                quantity=item.quantity,
                selectedOptions=SelectedOptionsIn(
                    woodType=wood_code, finish=finish_code, size=size_code,
                ),
            ))
        except AppException as e:
            reason = "PRODUCT_INACTIVE" if e.detail.get("code") == "PRODUCT_INACTIVE" else "OPTIONS_UNAVAILABLE"
            unavailable.append(UnavailableItemOut(
                productId=item.product_id,
                productSkuSnapshot=item.product_sku_snapshot,
                reason=reason,
            ))
            continue

        product = (await db.execute(
            select(Product).where(Product.id == item.product_id)
        )).scalar_one_or_none()
        inv = product.inventory if product else None
        if not inv or inv.available_qty < item.quantity:
            unavailable.append(UnavailableItemOut(
                productId=item.product_id,
                productSkuSnapshot=item.product_sku_snapshot,
                reason="OUT_OF_STOCK",
            ))
            continue

        available.append(ReorderItemOut(
            productId=item.product_id,
            quantity=item.quantity,
            selectedOptions={"woodType": wood_code, "finish": finish_code, "size": size_code},
            currentUnitPriceVnd=quote.unitPriceVnd,
        ))

    return ReorderResponse(items=available, unavailableItems=unavailable)
