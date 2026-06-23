import logging
from datetime import datetime, timezone, timedelta
from arq import cron
from arq.connections import RedisSettings
from app.core.config import settings
from app.core.database import AsyncSessionLocal as async_session_factory

logger = logging.getLogger("arq.worker")


async def evaluate_abandoned_carts(ctx: dict) -> dict:
    from sqlalchemy import select, and_
    from app.modules.cart_recovery.models import CartRecoverySession
    from app.modules.cart_recovery.service import generate_recovery_token
    from app.modules.customer_auth.models import Customer

    cutoff = datetime.now(timezone.utc) - timedelta(minutes=settings.ABANDONED_CART_DELAY_MINUTES)
    abandoned_count = 0

    async with async_session_factory() as db:
        sessions = (await db.execute(
            select(CartRecoverySession).where(
                CartRecoverySession.status == "ACTIVE",
                CartRecoverySession.last_activity_at < cutoff,
                CartRecoverySession.email.isnot(None),
                CartRecoverySession.reminder_sent_at.is_(None),
            )
        )).scalars().all()

        eligible = []
        for session in sessions:
            if session.customer_id:
                customer = (await db.execute(
                    select(Customer).where(Customer.id == session.customer_id)
                )).scalar_one_or_none()
                if not customer or not customer.marketing_opt_in:
                    continue
            else:
                if not session.marketing_opt_in:
                    continue
            session.status = "ABANDONED"
            session.abandoned_at = datetime.now(timezone.utc)
            abandoned_count += 1
            eligible.append(session)

        if abandoned_count:
            await db.commit()

        for session in eligible:
            token = await generate_recovery_token(db, session.id)
            await ctx["redis"].enqueue_job(
                "send_abandoned_cart_email",
                session_id=session.id,
                token=token,
                _job_id=f"abandoned_cart_email:{session.id}",
            )

    logger.info("evaluate_abandoned_carts: marked %d sessions as abandoned", abandoned_count)
    return {"abandoned": abandoned_count}


async def send_abandoned_cart_email(ctx: dict, session_id: str, token: str) -> dict:
    from sqlalchemy import select
    from app.modules.cart_recovery.models import CartRecoverySession

    async with async_session_factory() as db:
        session = (await db.execute(
            select(CartRecoverySession).where(CartRecoverySession.id == session_id)
        )).scalar_one_or_none()

        if not session or session.status != "ABANDONED":
            return {"skipped": True, "reason": "session not abandoned"}
        if session.reminder_sent_at:
            return {"skipped": True, "reason": "reminder already sent"}

        recovery_url = f"{settings.FRONTEND_BASE_URL}/{session.locale}/cart?recovery={token}"
        try:
            from app.modules.notification.service import send_abandoned_cart_email as _send
            await _send(db, session, recovery_url)
        except AttributeError:
            logger.warning("send_abandoned_cart_email: notification service not implemented yet")

        session.reminder_sent_at = datetime.now(timezone.utc)
        await db.commit()

    return {"sent": True, "sessionId": session_id}


async def expire_cart_recovery_sessions(ctx: dict) -> dict:
    from sqlalchemy import select
    from app.modules.cart_recovery.models import CartRecoverySession

    cutoff = datetime.now(timezone.utc) - timedelta(hours=settings.ABANDONED_CART_TOKEN_TTL_HOURS)
    expired_count = 0

    async with async_session_factory() as db:
        sessions = (await db.execute(
            select(CartRecoverySession).where(
                CartRecoverySession.status.in_(["ACTIVE", "ABANDONED"]),
                CartRecoverySession.created_at < cutoff,
            )
        )).scalars().all()

        for session in sessions:
            session.status = "EXPIRED"
            expired_count += 1

        if expired_count:
            await db.commit()

    logger.info("expire_cart_recovery_sessions: expired %d sessions", expired_count)
    return {"expired": expired_count}


async def retry_failed_noncritical_email(ctx: dict) -> dict:
    # Placeholder: requires retry_count column on EmailLog (future enhancement)
    return {"retried": 0}


async def startup(ctx: dict):
    logger.info("Arq worker starting up")


async def shutdown(ctx: dict):
    logger.info("Arq worker shutting down")


def _redis_settings() -> RedisSettings:
    url = settings.REDIS_URL
    # arq RedisSettings can accept a DSN string directly in newer versions
    return RedisSettings.from_dsn(url)


class WorkerSettings:
    functions = [
        evaluate_abandoned_carts,
        send_abandoned_cart_email,
        expire_cart_recovery_sessions,
        retry_failed_noncritical_email,
    ]
    redis_settings = _redis_settings()
    queue_name = settings.ARQ_QUEUE_NAME
    on_startup = startup
    on_shutdown = shutdown
    cron_jobs = [
        cron(
            evaluate_abandoned_carts,
            minute={i * settings.ABANDONED_CART_SCAN_INTERVAL_MINUTES for i in range(60 // settings.ABANDONED_CART_SCAN_INTERVAL_MINUTES)},
        ),
        cron(expire_cart_recovery_sessions, hour=3, minute=0),
    ]
