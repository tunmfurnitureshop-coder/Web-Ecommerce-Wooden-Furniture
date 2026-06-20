import uuid
import os
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from app.core.config import settings
from app.modules.notification.models import EmailLog
from app.shared.enums import EmailStatus


def _get_provider():
    if settings.EMAIL_PROVIDER.lower() == "resend":
        from app.modules.notification.resend_provider import ResendEmailProvider
        return ResendEmailProvider()
    from app.modules.notification.console_provider import ConsoleEmailProvider
    return ConsoleEmailProvider()


def _render_template(template_key: str, context: dict) -> str:
    base = os.path.dirname(__file__)
    tpl_path = os.path.join(base, "templates", f"{template_key}.html")
    if not os.path.exists(tpl_path):
        return f"<p>Email template '{template_key}' not found.</p>"
    with open(tpl_path, encoding="utf-8") as f:
        content = f.read()
    for k, v in context.items():
        content = content.replace("{{ " + k + " }}", str(v))
    return content


async def _check_already_sent(db: AsyncSession, order_id: str, template_key: str) -> bool:
    result = await db.execute(
        select(EmailLog).where(
            and_(
                EmailLog.related_order_id == order_id,
                EmailLog.template_key == template_key,
                EmailLog.status == EmailStatus.SENT,
            )
        )
    )
    return result.scalar_one_or_none() is not None


async def _send_and_log(
    db: AsyncSession,
    to: str,
    subject: str,
    template_key: str,
    context: dict,
    order_id: Optional[str] = None,
    tx_id: Optional[str] = None,
):
    if not to:
        db.add(EmailLog(
            id=str(uuid.uuid4()), provider=settings.EMAIL_PROVIDER.upper(),
            recipient_email="", subject=subject, template_key=template_key,
            status=EmailStatus.SKIPPED, related_order_id=order_id,
            related_payment_transaction_id=tx_id,
        ))
        return

    html = _render_template(template_key, context)
    provider = _get_provider()
    log = EmailLog(
        id=str(uuid.uuid4()), provider=settings.EMAIL_PROVIDER.upper(),
        recipient_email=to, subject=subject, template_key=template_key,
        status=EmailStatus.PENDING, related_order_id=order_id,
        related_payment_transaction_id=tx_id,
        raw_payload={"subject": subject, "to": to, "template": template_key},
    )
    db.add(log)
    try:
        result = await provider.send_email(to=to, subject=subject, html=html)
        if result.success:
            log.status = EmailStatus.SENT
            log.sent_at = datetime.now(timezone.utc)
        else:
            log.status = EmailStatus.FAILED
            log.error_message = result.error_message
    except Exception as e:
        log.status = EmailStatus.FAILED
        log.error_message = str(e)


async def send_order_created_emails(db: AsyncSession, order):
    ctx = {
        "order_code": order.order_code, "customer_name": order.customer_name,
        "total_vnd": f"{order.total_vnd:,}", "payment_method": order.payment_method,
        "order_status": order.order_status,
        "admin_order_url": f"http://localhost:3000/vi/admin/orders/{order.id}",
    }
    if order.customer_email:
        await _send_and_log(db, order.customer_email, f"Xác nhận đơn hàng {order.order_code}",
                            "order_created_customer", ctx, order_id=order.id)
    await _send_and_log(db, settings.ADMIN_NOTIFICATION_EMAIL, f"Đơn hàng mới {order.order_code}",
                        "order_created_admin", ctx, order_id=order.id)


async def send_payment_success_emails(db: AsyncSession, order, tx=None):
    if await _check_already_sent(db, order.id, "payment_success_customer"):
        return
    ctx = {
        "order_code": order.order_code, "customer_name": order.customer_name,
        "total_vnd": f"{order.total_vnd:,}", "payment_status": "PAID",
        "admin_order_url": f"http://localhost:3000/vi/admin/orders/{order.id}",
    }
    tx_id = tx.id if tx else None
    if order.customer_email:
        await _send_and_log(db, order.customer_email,
                            f"Thanh toán thành công cho đơn hàng {order.order_code}",
                            "payment_success_customer", ctx, order_id=order.id, tx_id=tx_id)
    await _send_and_log(db, settings.ADMIN_NOTIFICATION_EMAIL,
                        f"Đã nhận thanh toán cho đơn hàng {order.order_code}",
                        "payment_success_admin", ctx, order_id=order.id, tx_id=tx_id)


async def send_payment_failed_email(db: AsyncSession, order, reason: str = "failed"):
    ctx = {"order_code": order.order_code, "customer_name": order.customer_name,
           "total_vnd": f"{order.total_vnd:,}"}
    if order.customer_email:
        await _send_and_log(db, order.customer_email,
                            f"Thanh toán chưa thành công cho đơn hàng {order.order_code}",
                            "payment_failed_customer", ctx, order_id=order.id)


async def send_order_cancelled_email(db: AsyncSession, order):
    ctx = {"order_code": order.order_code, "customer_name": order.customer_name}
    if order.customer_email:
        await _send_and_log(db, order.customer_email,
                            f"Đơn hàng {order.order_code} đã bị huỷ",
                            "order_cancelled_customer", ctx, order_id=order.id)
