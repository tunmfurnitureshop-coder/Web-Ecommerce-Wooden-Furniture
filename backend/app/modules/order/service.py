import hashlib
import uuid
from datetime import datetime, timezone
from typing import Optional
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


def _initial_statuses(payment_method: str) -> tuple:
    if payment_method == PaymentMethod.COD:
        return OrderStatus.PROCESSING, PaymentStatus.PENDING
    elif payment_method == PaymentMethod.BANK_TRANSFER:
        return OrderStatus.PENDING_PAYMENT, PaymentStatus.PENDING
    elif payment_method == PaymentMethod.PAYOS:
        return OrderStatus.PENDING_PAYMENT, PaymentStatus.PENDING
    elif payment_method == PaymentMethod.MOCK_PROVIDER:
        return OrderStatus.PAID, PaymentStatus.PAID
    raise AppException(422, "VALIDATION_ERROR", "Invalid payment method.")


async def create_order(
    db: AsyncSession,
    req: CreateOrderRequest,
    customer_id: Optional[str] = None,
    idempotency_key: Optional[str] = None,
) -> CreateOrderResponse:
    if not req.items:
        raise AppException(422, "VALIDATION_ERROR", "Cart cannot be empty.")
    if req.paymentMethod not in [m.value for m in PaymentMethod]:
        raise AppException(422, "VALIDATION_ERROR", "Invalid payment method.")

    from app.modules.promotion import idempotency as idem_service
    idem_record = None
    if idempotency_key:
        req_hash = idem_service.hash_request(req.model_dump())
        idem_record, is_new = await idem_service.get_or_create(
            db, "order_create", idempotency_key, req_hash, customer_id=customer_id
        )
        if not is_new:
            if idem_record.request_hash != req_hash:
                raise AppException(409, "IDEMPOTENCY_KEY_REUSED_WITH_DIFFERENT_REQUEST",
                                   "Idempotency key reused with a different request body.")
            if idem_record.status == "DONE" and idem_record.response_body:
                return CreateOrderResponse(**idem_record.response_body)
            raise AppException(409, "ORDER_ALREADY_PROCESSING", "Order creation is already in progress.")

    # Re-evaluate cart + promotion (authoritative backend pricing)
    from app.modules.promotion.schemas import CartQuoteRequest, CartQuoteItemIn
    from app.modules.promotion import evaluator as promo_eval
    quote = await promo_eval.quote_cart(
        CartQuoteRequest(
            locale="vi",
            paymentMethod=req.paymentMethod,
            couponCode=req.couponCode,
            items=[CartQuoteItemIn(
                productId=i.productId,
                quantity=i.quantity,
                selectedOptions=i.selectedOptions,
            ) for i in req.items],
        ),
        db,
        customer_id=customer_id,
    )
    quote_map = {qi.productId: qi for qi in quote.items}

    order_items_data = []
    for item in req.items:
        qi = quote_map.get(item.productId)
        if not qi:
            raise AppException(422, "VALIDATION_ERROR", f"Product {item.productId} could not be priced.")
        options = SelectedOptionsIn(
            woodType=item.selectedOptions.get("woodType", ""),
            finish=item.selectedOptions.get("finish", ""),
            size=item.selectedOptions.get("size", ""),
        )
        product = (await db.execute(select(Product).where(Product.id == item.productId))).scalar_one_or_none()
        if not product:
            raise AppException(422, "VALIDATION_ERROR", f"Product {item.productId} not found.")
        trans = (await db.execute(select(ProductTranslation).where(
            ProductTranslation.product_id == product.id, ProductTranslation.locale == "vi"
        ))).scalar_one_or_none()
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
            "unit_price": qi.unitPriceVnd, "line_total": qi.lineTotalVnd,
            "quantity": item.quantity, "snapshot": snapshot,
            "promo_discount": qi.promotionDiscountVnd,
            "final_line_total": qi.finalLineTotalVnd,
        })

    # Campaign attribution — resolve server-side, never trust client campaign_id
    campaign_id = None
    attribution_snapshot = None
    if req.campaignCode:
        from app.modules.campaign.service import validate_campaign_code
        campaign = await validate_campaign_code(db, req.campaignCode)
        if campaign:
            campaign_id = campaign.id
            attribution_snapshot = {"campaignCode": req.campaignCode}

    order_code = await _generate_order_code(db)
    order_status, payment_status = _initial_statuses(req.paymentMethod)
    order = Order(
        id=str(uuid.uuid4()), order_code=order_code,
        customer_name=req.customerName, customer_phone=req.customerPhone,
        customer_email=req.customerEmail, shipping_address=req.shippingAddress, note=req.note,
        subtotal_vnd=quote.merchandiseSubtotalVnd,
        merchandise_subtotal_vnd=quote.merchandiseSubtotalVnd,
        promotion_discount_vnd=quote.promotionDiscountVnd,
        total_discount_vnd=quote.totalDiscountVnd,
        shipping_fee_vnd=0,
        total_vnd=quote.totalVnd,
        order_status=order_status, payment_status=payment_status, payment_method=req.paymentMethod,
        customer_id=customer_id,
        guest_email=req.customerEmail.lower() if not customer_id and req.customerEmail else None,
        cart_recovery_session_id=req.cartRecoverySessionId,
        campaign_id=campaign_id,
        attribution_snapshot=attribution_snapshot,
    )
    db.add(order)
    for d in order_items_data:
        db.add(OrderItem(
            id=str(uuid.uuid4()), order_id=order.id, product_id=d["product"].id,
            product_name_snapshot=d["trans"].name if d["trans"] else d["product"].sku,
            product_sku_snapshot=d["product"].sku,
            selected_options_snapshot=d["snapshot"],
            unit_price_vnd=d["unit_price"], quantity=d["quantity"], line_total_vnd=d["line_total"],
            promotion_discount_vnd=d["promo_discount"],
            final_line_total_vnd=d["final_line_total"],
        ))
        d["inv"].reserved_qty += d["quantity"]

    if quote.appliedPromotion:
        from app.modules.promotion.models import OrderPromotion, PromotionRedemption
        db.add(OrderPromotion(
            order_id=order.id,
            promotion_id=quote.appliedPromotion.id,
            promotion_code_snapshot=quote.appliedPromotion.code,
            promotion_name_snapshot=quote.appliedPromotion.name,
            trigger_snapshot=quote.appliedPromotion.trigger,
            scope_type_snapshot=quote.appliedPromotion.scopeType,
            discount_type_snapshot=quote.appliedPromotion.discountType,
            discount_vnd=quote.appliedPromotion.discountVnd,
            allocation_snapshot=[
                {"productId": i.productId, "discountVnd": i.promotionDiscountVnd}
                for i in quote.items
            ],
        ))
        guest_email_hash = None
        if not customer_id and req.customerEmail:
            guest_email_hash = hashlib.sha256(req.customerEmail.lower().encode()).hexdigest()
        db.add(PromotionRedemption(
            promotion_id=quote.appliedPromotion.id,
            order_id=order.id,
            customer_id=customer_id,
            guest_email_hash=guest_email_hash,
            discount_vnd=quote.appliedPromotion.discountVnd,
        ))

    await db.commit()

    checkout_url = None
    payment_tx_id = None

    from app.modules.order.events import create_order_event
    from app.shared.enums import OrderEventActorType
    await create_order_event(db, order.id, "ORDER_CREATED", OrderEventActorType.SYSTEM)

    try:
        from app.modules.events.service import record_server_event
        from app.shared.enums import CommerceEventName
        await record_server_event(
            db, CommerceEventName.ORDER_CREATED,
            order_id=order.id, customer_id=customer_id, campaign_id=campaign_id,
        )
        if quote.appliedPromotion:
            await record_server_event(
                db, CommerceEventName.PROMOTION_APPLIED,
                order_id=order.id, promotion_id=quote.appliedPromotion.id,
                customer_id=customer_id,
                payload={"promotionCode": quote.appliedPromotion.code, "discountVnd": quote.appliedPromotion.discountVnd},
            )
        await db.commit()
    except Exception:
        pass

    if req.paymentMethod == PaymentMethod.PAYOS:
        from app.modules.payment.service import create_payment_transaction
        from app.modules.payment.payos_provider import PayOSProvider
        from app.shared.enums import PaymentTransactionStatus
        tx = await create_payment_transaction(db, order, "PAYOS")
        await db.flush()
        try:
            provider = PayOSProvider()
            result = await provider.create_payment_link(order, tx)
            tx.status = PaymentTransactionStatus.PENDING
            tx.checkout_url = result.checkout_url
            tx.provider_payment_link_id = result.provider_payment_link_id
            tx.provider_order_code = result.provider_order_code
            tx.qr_code = result.qr_code
            tx.raw_response = result.raw_response
            order.payment_provider = "PAYOS"
            order.latest_payment_transaction_id = tx.id
            checkout_url = result.checkout_url
            payment_tx_id = tx.id
            await create_order_event(db, order.id, "PAYMENT_LINK_CREATED", OrderEventActorType.SYSTEM,
                                     new_value={"paymentLinkId": result.provider_payment_link_id})
            try:
                from app.modules.events.service import record_server_event
                from app.shared.enums import CommerceEventName
                await record_server_event(
                    db, CommerceEventName.PAYMENT_INITIATED,
                    order_id=order.id, customer_id=customer_id, campaign_id=campaign_id,
                )
            except Exception:
                pass
            await db.commit()
        except Exception as e:
            tx.status = PaymentTransactionStatus.FAILED
            order.payment_status = PaymentStatus.FAILED
            await create_order_event(db, order.id, "PAYMENT_LINK_CREATE_FAILED", OrderEventActorType.SYSTEM,
                                     note=str(e))
            await db.commit()
            raise AppException(502, "PAYMENT_LINK_CREATE_FAILED",
                               "Order was created but payment link creation failed.",
                               {"orderCode": order_code})

    try:
        from app.modules.notification.service import send_order_created_emails
        await send_order_created_emails(db, order)
        await db.commit()
    except Exception:
        pass

    response = CreateOrderResponse(
        orderCode=order_code, orderStatus=order_status, paymentStatus=payment_status,
        paymentMethod=req.paymentMethod,
        merchandiseSubtotalVnd=quote.merchandiseSubtotalVnd,
        promotionDiscountVnd=quote.promotionDiscountVnd,
        totalDiscountVnd=quote.totalDiscountVnd,
        totalVnd=quote.totalVnd,
        checkoutUrl=checkout_url, paymentTransactionId=payment_tx_id,
    )
    if idem_record:
        await idem_service.complete(db, idem_record, response.model_dump())
        await db.commit()
    return response


async def get_order_by_code(db: AsyncSession, order_code: str) -> OrderSummaryResponse:
    result = await db.execute(select(Order).where(Order.order_code == order_code))
    order = result.scalar_one_or_none()
    if not order:
        raise AppException(404, "ORDER_NOT_FOUND", "Order not found.")
    return _map_order(order)


async def get_order_payment_status(db: AsyncSession, order_code: str) -> dict:
    order = (await db.execute(select(Order).where(Order.order_code == order_code))).scalar_one_or_none()
    if not order:
        raise AppException(404, "ORDER_NOT_FOUND", "Order not found.")
    latest_tx = None
    if order.latest_payment_transaction_id:
        from app.modules.payment.models import PaymentTransaction
        tx = (await db.execute(
            select(PaymentTransaction).where(PaymentTransaction.id == order.latest_payment_transaction_id)
        )).scalar_one_or_none()
        if tx:
            latest_tx = {"id": tx.id, "provider": tx.provider, "status": tx.status,
                         "amountVnd": tx.amount_vnd, "paidAt": tx.paid_at}
    return {
        "orderCode": order.order_code, "paymentStatus": order.payment_status,
        "orderStatus": order.order_status, "paymentMethod": order.payment_method,
        "latestTransaction": latest_tx,
    }


async def retry_payment(db: AsyncSession, order_code: str) -> dict:
    order = (await db.execute(select(Order).where(Order.order_code == order_code))).scalar_one_or_none()
    if not order:
        raise AppException(404, "ORDER_NOT_FOUND", "Order not found.")
    if order.payment_method != PaymentMethod.PAYOS:
        raise AppException(422, "MANUAL_PAYMENT_NOT_ALLOWED", "Retry only available for PAYOS orders.")
    if order.payment_status == PaymentStatus.PAID:
        raise AppException(422, "PAYMENT_STATUS_INVALID_TRANSITION", "Order already paid.")
    if order.order_status == OrderStatus.CANCELLED:
        raise AppException(422, "PAYMENT_STATUS_INVALID_TRANSITION", "Cannot retry cancelled order.")
    if order.order_status == OrderStatus.DELIVERED:
        raise AppException(422, "PAYMENT_STATUS_INVALID_TRANSITION", "Cannot retry delivered order.")
    from app.modules.payment.service import create_payment_transaction
    from app.modules.payment.payos_provider import PayOSProvider
    from app.shared.enums import PaymentTransactionStatus, OrderEventActorType
    from app.modules.order.events import create_order_event
    tx = await create_payment_transaction(db, order, "PAYOS")
    await db.flush()
    provider = PayOSProvider()
    result = await provider.create_payment_link(order, tx)
    tx.status = PaymentTransactionStatus.PENDING
    tx.checkout_url = result.checkout_url
    tx.provider_payment_link_id = result.provider_payment_link_id
    tx.provider_order_code = result.provider_order_code
    tx.raw_response = result.raw_response
    order.latest_payment_transaction_id = tx.id
    order.order_status = OrderStatus.PENDING_PAYMENT
    order.payment_status = PaymentStatus.PENDING
    await create_order_event(db, order.id, "PAYMENT_RETRY_CREATED", OrderEventActorType.SYSTEM,
                             new_value={"paymentLinkId": result.provider_payment_link_id})
    await db.commit()
    return {
        "orderCode": order.order_code,
        "paymentTransactionId": tx.id,
        "checkoutUrl": result.checkout_url,
        "paymentStatus": order.payment_status,
        "orderStatus": order.order_status,
    }


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
            {"id": o.id, "orderCode": o.order_code, "customerName": o.customer_name,
             "customerPhone": o.customer_phone, "totalVnd": o.total_vnd,
             "orderStatus": o.order_status, "paymentStatus": o.payment_status,
             "paymentMethod": o.payment_method, "createdAt": o.created_at}
            for o in orders
        ],
        "page": page, "pageSize": page_size, "total": count,
    }


async def admin_get_order_detail(db: AsyncSession, order_id: str) -> dict:
    order = (await db.execute(select(Order).where(Order.id == order_id))).scalar_one_or_none()
    if not order:
        raise AppException(404, "ORDER_NOT_FOUND", "Order not found.")
    from app.modules.payment.models import PaymentTransaction
    from app.modules.order.events import OrderEvent
    from app.modules.notification.models import EmailLog
    txs = (await db.execute(
        select(PaymentTransaction).where(PaymentTransaction.order_id == order_id).order_by(PaymentTransaction.created_at.desc())
    )).scalars().all()
    events = (await db.execute(
        select(OrderEvent).where(OrderEvent.order_id == order_id).order_by(OrderEvent.created_at)
    )).scalars().all()
    logs = (await db.execute(
        select(EmailLog).where(EmailLog.related_order_id == order_id).order_by(EmailLog.created_at)
    )).scalars().all()
    return {
        "id": order.id, "orderCode": order.order_code,
        "customerName": order.customer_name, "customerPhone": order.customer_phone,
        "customerEmail": order.customer_email, "shippingAddress": order.shipping_address,
        "note": order.note, "subtotalVnd": order.subtotal_vnd,
        "shippingFeeVnd": order.shipping_fee_vnd, "totalVnd": order.total_vnd,
        "orderStatus": order.order_status, "paymentStatus": order.payment_status,
        "paymentMethod": order.payment_method, "currency": order.currency,
        "paymentCompletedAt": order.payment_completed_at, "createdAt": order.created_at,
        "items": [
            {"id": i.id, "productId": i.product_id, "productNameSnapshot": i.product_name_snapshot,
             "productSkuSnapshot": i.product_sku_snapshot, "selectedOptionsSnapshot": i.selected_options_snapshot,
             "unitPriceVnd": i.unit_price_vnd, "quantity": i.quantity, "lineTotalVnd": i.line_total_vnd}
            for i in order.items
        ],
        "paymentTransactions": [
            {"id": t.id, "provider": t.provider, "status": t.status, "amountVnd": t.amount_vnd,
             "providerOrderCode": t.provider_order_code, "checkoutUrl": t.checkout_url,
             "paidAt": t.paid_at, "createdAt": t.created_at}
            for t in txs
        ],
        "orderEvents": [
            {"id": e.id, "eventType": e.event_type, "actorType": e.actor_type,
             "oldValue": e.old_value, "newValue": e.new_value, "note": e.note, "createdAt": e.created_at}
            for e in events
        ],
        "emailLogs": [
            {"id": l.id, "recipientEmail": l.recipient_email, "subject": l.subject,
             "templateKey": l.template_key, "status": l.status, "sentAt": l.sent_at, "createdAt": l.created_at}
            for l in logs
        ],
    }


async def admin_update_order_status(db: AsyncSession, order_id: str, req: UpdateOrderStatusRequest) -> dict:
    from app.modules.promotion import lifecycle as promo_lifecycle
    order = (await db.execute(select(Order).where(Order.id == order_id))).scalar_one_or_none()
    if not order:
        raise AppException(404, "ORDER_NOT_FOUND", "Order not found.")
    prev_order_status = order.order_status
    prev_payment_status = order.payment_status
    if req.orderStatus:
        order.order_status = req.orderStatus
    if req.paymentStatus:
        order.payment_status = req.paymentStatus
    if req.orderStatus == OrderStatus.CANCELLED and prev_order_status != OrderStatus.CANCELLED:
        for item in order.items:
            inv = (await db.execute(select(InventoryItem).where(InventoryItem.product_id == item.product_id))).scalar_one_or_none()
            if inv:
                inv.reserved_qty = max(0, inv.reserved_qty - item.quantity)
        await promo_lifecycle.release_for_order(db, order_id)
        try:
            from app.modules.notification.service import send_order_cancelled_email
            await send_order_cancelled_email(db, order)
        except Exception:
            pass
        try:
            from app.modules.events.service import record_server_event
            from app.shared.enums import CommerceEventName
            await record_server_event(db, CommerceEventName.ORDER_CANCELLED, order_id=order_id)
        except Exception:
            pass
    if req.paymentStatus == PaymentStatus.PAID and prev_payment_status != PaymentStatus.PAID:
        await promo_lifecycle.redeem_for_order(db, order_id)
        try:
            from app.modules.events.service import record_server_event
            from app.shared.enums import CommerceEventName
            await record_server_event(db, CommerceEventName.PAYMENT_COMPLETED, order_id=order_id)
            await record_server_event(db, CommerceEventName.PURCHASE_COMPLETED, order_id=order_id)
        except Exception:
            pass
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
                productId=i.product_id, productNameSnapshot=i.product_name_snapshot,
                productSkuSnapshot=i.product_sku_snapshot, selectedOptionsSnapshot=i.selected_options_snapshot,
                unitPriceVnd=i.unit_price_vnd, quantity=i.quantity, lineTotalVnd=i.line_total_vnd,
            )
            for i in order.items
        ],
    )
