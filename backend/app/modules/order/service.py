import uuid
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.modules.order.models import Order, OrderItem
from app.modules.product.models import Product, ProductTranslation
from app.modules.inventory.models import (
    WoodType, WoodTypeTranslation, FinishOption, FinishOptionTranslation,
    SizeOption, SizeOptionTranslation, InventoryItem
)
from app.modules.pricing.service import calculate_quote
from app.modules.pricing.schemas import PricingQuoteRequest, SelectedOptionsIn
from app.modules.order.schemas import (
    CreateOrderRequest, CreateOrderResponse, OrderSummaryResponse, OrderItemOut, UpdateOrderStatusRequest
)
from app.core.exceptions import AppException
from app.shared.enums import OrderStatus, PaymentStatus, PaymentMethod


def _get_trans(translations, locale="vi", fallback="vi"):
    for t in translations:
        if t.locale == locale:
            return t
    for t in translations:
        if t.locale == fallback:
            return t
    return translations[0] if translations else None


async def _generate_order_code(db: AsyncSession) -> str:
    year = datetime.now(timezone.utc).year
    result = await db.execute(
        select(func.count(Order.id)).where(Order.order_code.like(f"ORD-{year}-%"))
    )
    count = result.scalar_one()
    return f"ORD-{year}-{str(count + 1).zfill(6)}"


def _initial_statuses(payment_method: str) -> tuple[str, str]:
    if payment_method == PaymentMethod.COD:
        return OrderStatus.PROCESSING, PaymentStatus.PENDING
    elif payment_method == PaymentMethod.BANK_TRANSFER:
        return OrderStatus.PENDING_PAYMENT, PaymentStatus.PENDING
    elif payment_method == PaymentMethod.MOCK_PROVIDER:
        return OrderStatus.PAID, PaymentStatus.PAID
    raise AppException(422, "VALIDATION_ERROR", "Invalid payment method.")


async def create_order(db: AsyncSession, req: CreateOrderRequest) -> CreateOrderResponse:
    if not req.items:
        raise AppException(422, "VALIDATION_ERROR", "Cart cannot be empty.")
    if req.paymentMethod not in [m.value for m in PaymentMethod]:
        raise AppException(422, "VALIDATION_ERROR", "Invalid payment method.")

    order_items_data = []
    subtotal = 0

    for item in req.items:
        options = SelectedOptionsIn(
            woodType=item.selectedOptions.get("woodType", ""),
            finish=item.selectedOptions.get("finish", ""),
            size=item.selectedOptions.get("size", ""),
        )
        quote = await calculate_quote(db, PricingQuoteRequest(
            productId=item.productId, quantity=item.quantity, selectedOptions=options
        ))

        product = (await db.execute(select(Product).where(Product.id == item.productId))).scalar_one_or_none()
        trans_result = await db.execute(select(ProductTranslation).where(ProductTranslation.product_id == product.id, ProductTranslation.locale == "vi"))
        trans = trans_result.scalar_one_or_none()

        inv = (await db.execute(select(InventoryItem).where(InventoryItem.product_id == product.id))).scalar_one_or_none()
        if not inv or inv.available_qty < item.quantity:
            raise AppException(422, "INSUFFICIENT_STOCK", f"Not enough stock for product {product.sku}.")

        wt = (await db.execute(select(WoodType).where(WoodType.code == options.woodType))).scalar_one_or_none()
        fo = (await db.execute(select(FinishOption).where(FinishOption.code == options.finish))).scalar_one_or_none()
        so = (await db.execute(select(SizeOption).where(SizeOption.code == options.size))).scalar_one_or_none()

        wt_tr = _get_trans((await db.execute(select(WoodTypeTranslation).where(WoodTypeTranslation.wood_type_id == wt.id))).scalars().all())
        fo_tr = _get_trans((await db.execute(select(FinishOptionTranslation).where(FinishOptionTranslation.finish_option_id == fo.id))).scalars().all())
        so_tr = _get_trans((await db.execute(select(SizeOptionTranslation).where(SizeOptionTranslation.size_option_id == so.id))).scalars().all())

        snapshot = {
            "woodType": {"code": wt.code, "label": wt_tr.name if wt_tr else wt.code, "priceDeltaVnd": wt.price_delta_vnd},
            "finish": {"code": fo.code, "label": fo_tr.name if fo_tr else fo.code, "priceDeltaVnd": fo.price_delta_vnd},
            "size": {"code": so.code, "label": so_tr.name if so_tr else so.code, "priceDeltaVnd": so.price_delta_vnd},
        }

        order_items_data.append({
            "product": product, "trans": trans, "inv": inv,
            "unit_price": quote.unitPriceVnd, "line_total": quote.lineTotalVnd,
            "quantity": item.quantity, "snapshot": snapshot,
        })
        subtotal += quote.lineTotalVnd

    order_code = await _generate_order_code(db)
    order_status, payment_status = _initial_statuses(req.paymentMethod)

    order = Order(
        id=str(uuid.uuid4()), order_code=order_code,
        customer_name=req.customerName, customer_phone=req.customerPhone,
        customer_email=req.customerEmail, shipping_address=req.shippingAddress, note=req.note,
        subtotal_vnd=subtotal, shipping_fee_vnd=0, total_vnd=subtotal,
        order_status=order_status, payment_status=payment_status, payment_method=req.paymentMethod,
    )
    db.add(order)

    for d in order_items_data:
        db.add(OrderItem(
            id=str(uuid.uuid4()), order_id=order.id, product_id=d["product"].id,
            product_name_snapshot=d["trans"].name if d["trans"] else d["product"].sku,
            product_sku_snapshot=d["product"].sku,
            selected_options_snapshot=d["snapshot"],
            unit_price_vnd=d["unit_price"], quantity=d["quantity"], line_total_vnd=d["line_total"],
        ))
        d["inv"].reserved_qty += d["quantity"]

    await db.commit()
    return CreateOrderResponse(orderCode=order_code, orderStatus=order_status, paymentStatus=payment_status, totalVnd=subtotal)


async def get_order_by_code(db: AsyncSession, order_code: str) -> OrderSummaryResponse:
    result = await db.execute(select(Order).where(Order.order_code == order_code))
    order = result.scalar_one_or_none()
    if not order:
        raise AppException(404, "ORDER_NOT_FOUND", "Order not found.")
    return _map_order(order)


async def admin_get_orders(db: AsyncSession, order_status=None, payment_status=None, payment_method=None, page=1, page_size=20):
    query = select(Order)
    if order_status:
        query = query.where(Order.order_status == order_status)
    if payment_status:
        query = query.where(Order.payment_status == payment_status)
    if payment_method:
        query = query.where(Order.payment_method == payment_method)

    count = (await db.execute(select(func.count()).select_from(query.subquery()))).scalar_one()
    orders = (await db.execute(query.offset((page - 1) * page_size).limit(page_size).order_by(Order.created_at.desc()))).scalars().all()

    return {
        "items": [
            {
                "id": o.id, "orderCode": o.order_code, "customerName": o.customer_name,
                "customerPhone": o.customer_phone, "totalVnd": o.total_vnd,
                "orderStatus": o.order_status, "paymentStatus": o.payment_status,
                "paymentMethod": o.payment_method, "createdAt": o.created_at,
            }
            for o in orders
        ],
        "page": page, "pageSize": page_size, "total": count,
    }


async def admin_get_order_detail(db: AsyncSession, order_id: str) -> dict:
    order = (await db.execute(select(Order).where(Order.id == order_id))).scalar_one_or_none()
    if not order:
        raise AppException(404, "ORDER_NOT_FOUND", "Order not found.")
    return {
        "id": order.id, "orderCode": order.order_code,
        "customerName": order.customer_name, "customerPhone": order.customer_phone,
        "customerEmail": order.customer_email, "shippingAddress": order.shipping_address,
        "note": order.note, "subtotalVnd": order.subtotal_vnd,
        "shippingFeeVnd": order.shipping_fee_vnd, "totalVnd": order.total_vnd,
        "orderStatus": order.order_status, "paymentStatus": order.payment_status,
        "paymentMethod": order.payment_method, "currency": order.currency,
        "createdAt": order.created_at,
        "items": [
            {
                "id": i.id, "productId": i.product_id,
                "productNameSnapshot": i.product_name_snapshot,
                "productSkuSnapshot": i.product_sku_snapshot,
                "selectedOptionsSnapshot": i.selected_options_snapshot,
                "unitPriceVnd": i.unit_price_vnd, "quantity": i.quantity,
                "lineTotalVnd": i.line_total_vnd,
            }
            for i in order.items
        ],
    }


async def admin_update_order_status(db: AsyncSession, order_id: str, req: UpdateOrderStatusRequest) -> dict:
    order = (await db.execute(select(Order).where(Order.id == order_id))).scalar_one_or_none()
    if not order:
        raise AppException(404, "ORDER_NOT_FOUND", "Order not found.")

    prev_order_status = order.order_status

    if req.orderStatus:
        order.order_status = req.orderStatus
    if req.paymentStatus:
        order.payment_status = req.paymentStatus

    if req.orderStatus == OrderStatus.CANCELLED and prev_order_status != OrderStatus.CANCELLED:
        for item in order.items:
            inv = (await db.execute(select(InventoryItem).where(InventoryItem.product_id == item.product_id))).scalar_one_or_none()
            if inv:
                inv.reserved_qty = max(0, inv.reserved_qty - item.quantity)

    if req.orderStatus == OrderStatus.DELIVERED and prev_order_status != OrderStatus.DELIVERED:
        for item in order.items:
            inv = (await db.execute(select(InventoryItem).where(InventoryItem.product_id == item.product_id))).scalar_one_or_none()
            if inv:
                inv.total_qty = max(0, inv.total_qty - item.quantity)
                inv.reserved_qty = max(0, inv.reserved_qty - item.quantity)

    await db.commit()
    return {"orderCode": order.order_code, "orderStatus": order.order_status, "paymentStatus": order.payment_status}


def _map_order(order: Order) -> OrderSummaryResponse:
    return OrderSummaryResponse(
        orderCode=order.order_code, customerName=order.customer_name,
        orderStatus=order.order_status, paymentStatus=order.payment_status,
        paymentMethod=order.payment_method, totalVnd=order.total_vnd,
        createdAt=order.created_at,
        items=[
            OrderItemOut(
                productId=i.product_id,
                productNameSnapshot=i.product_name_snapshot,
                productSkuSnapshot=i.product_sku_snapshot,
                selectedOptionsSnapshot=i.selected_options_snapshot,
                unitPriceVnd=i.unit_price_vnd, quantity=i.quantity, lineTotalVnd=i.line_total_vnd,
            )
            for i in order.items
        ],
    )
