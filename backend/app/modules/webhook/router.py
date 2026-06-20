from datetime import datetime, timezone
from fastapi import APIRouter, Request, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.modules.webhook import service as webhook_service
from app.modules.payment.service import (
    get_transaction_by_provider_order_code,
    get_transaction_by_payment_link_id,
    apply_payment_success,
    apply_payment_cancelled,
    apply_payment_failed,
)
from app.modules.order.models import Order
from app.shared.enums import WebhookProcessingStatus, WebhookProvider

router = APIRouter(tags=["webhooks"])


@router.post("/webhooks/payos")
async def payos_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    try:
        payload = await request.json()
    except Exception:
        return JSONResponse(status_code=400, content={"error": "Invalid JSON"})

    signature = request.headers.get("x-webhook-signature")
    webhook_event = await webhook_service.store_webhook_event(
        db, WebhookProvider.PAYOS, payload, signature=signature
    )

    from app.modules.payment.payos_provider import PayOSProvider
    provider = PayOSProvider()

    is_valid = await provider.verify_webhook(payload, signature)
    if not is_valid:
        webhook_event.processing_status = WebhookProcessingStatus.FAILED
        webhook_event.error_message = "Invalid signature"
        await db.commit()
        return JSONResponse(status_code=400, content={"error": "Invalid webhook signature"})

    try:
        parsed = await provider.parse_webhook(payload)
    except Exception as e:
        webhook_event.processing_status = WebhookProcessingStatus.FAILED
        webhook_event.error_message = str(e)
        await db.commit()
        return JSONResponse(status_code=200, content={"received": True})

    tx = await get_transaction_by_provider_order_code(db, parsed.provider_order_code)
    if not tx and parsed.payment_link_id:
        tx = await get_transaction_by_payment_link_id(db, parsed.payment_link_id)

    if not tx:
        webhook_event.processing_status = WebhookProcessingStatus.FAILED
        webhook_event.error_message = f"Transaction not found: {parsed.provider_order_code}"
        await db.commit()
        return JSONResponse(status_code=200, content={"received": True})

    order = (await db.execute(select(Order).where(Order.id == tx.order_id))).scalar_one_or_none()
    if not order:
        webhook_event.processing_status = WebhookProcessingStatus.FAILED
        webhook_event.error_message = "Order not found"
        await db.commit()
        return JSONResponse(status_code=200, content={"received": True})

    already_paid = await webhook_service.check_already_paid(db, order)
    if already_paid and parsed.status == "PAID":
        webhook_event.processing_status = WebhookProcessingStatus.IGNORED
        webhook_event.error_message = "Already paid"
        await db.commit()
        return JSONResponse(status_code=200, content={"received": True})

    if parsed.status == "PAID":
        await apply_payment_success(db, tx, order)
        try:
            from app.modules.notification.service import send_payment_success_emails
            await send_payment_success_emails(db, order, tx)
        except Exception:
            pass
    elif parsed.status == "CANCELLED":
        await apply_payment_cancelled(db, tx, order)
        try:
            from app.modules.notification.service import send_payment_failed_email
            await send_payment_failed_email(db, order, "cancelled")
        except Exception:
            pass
    else:
        await apply_payment_failed(db, tx, order)

    webhook_event.processing_status = WebhookProcessingStatus.PROCESSED
    webhook_event.processed_at = datetime.now(timezone.utc)
    await db.commit()
    return JSONResponse(status_code=200, content={"received": True})
