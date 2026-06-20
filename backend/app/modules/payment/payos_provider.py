import hashlib
import hmac
from typing import Optional
import httpx
from app.core.config import settings
from app.modules.payment.provider import PaymentProviderInterface
from app.modules.payment.schemas import PaymentLinkResult, ParsedPaymentWebhook

PAYOS_API_BASE = "https://api-merchant.payos.vn"


def _build_checksum(data: dict, checksum_key: str) -> str:
    sorted_keys = sorted(data.keys())
    raw = "&".join(f"{k}={data[k]}" for k in sorted_keys if data[k] is not None)
    return hmac.new(checksum_key.encode(), raw.encode(), hashlib.sha256).hexdigest()


class PayOSProvider(PaymentProviderInterface):
    async def create_payment_link(self, order, transaction) -> PaymentLinkResult:
        provider_order_code = int(transaction.id.replace("-", "")[:15], 16) % (10 ** 10)

        payload = {
            "orderCode": provider_order_code,
            "amount": order.total_vnd,
            "description": f"Don hang {order.order_code}"[:25],
            "returnUrl": settings.PAYOS_RETURN_URL,
            "cancelUrl": settings.PAYOS_CANCEL_URL,
            "buyerName": order.customer_name,
            "buyerEmail": order.customer_email or "",
            "buyerPhone": order.customer_phone,
            "buyerAddress": (order.shipping_address or "")[:100],
            "items": [{"name": "San pham go", "quantity": 1, "price": order.total_vnd}],
        }

        sign_data = {
            "amount": str(payload["amount"]),
            "cancelUrl": payload["cancelUrl"],
            "description": payload["description"],
            "orderCode": str(payload["orderCode"]),
            "returnUrl": payload["returnUrl"],
        }
        payload["signature"] = _build_checksum(sign_data, settings.PAYOS_CHECKSUM_KEY)

        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                f"{PAYOS_API_BASE}/v2/payment-requests",
                json=payload,
                headers={
                    "x-client-id": settings.PAYOS_CLIENT_ID,
                    "x-api-key": settings.PAYOS_API_KEY,
                    "Content-Type": "application/json",
                },
            )
            resp.raise_for_status()
            data = resp.json()

        if data.get("code") != "00":
            raise Exception(f"payOS error: {data.get('desc', 'Unknown error')}")

        checkout_data = data.get("data", {})
        return PaymentLinkResult(
            checkout_url=checkout_data.get("checkoutUrl", ""),
            provider_payment_link_id=checkout_data.get("paymentLinkId"),
            provider_order_code=str(provider_order_code),
            qr_code=checkout_data.get("qrCode"),
            raw_response=data,
        )

    async def verify_webhook(self, payload: dict, signature: Optional[str]) -> bool:
        if not settings.PAYOS_CHECKSUM_KEY:
            return True

        data = payload.get("data", {})
        sign_fields = {
            "amount": str(data.get("amount", "")),
            "code": str(payload.get("code", "")),
            "desc": str(payload.get("desc", "")),
            "orderCode": str(data.get("orderCode", "")),
            "reference": str(data.get("reference", "")),
            "transactionDateTime": str(data.get("transactionDateTime", "")),
            "accountNumber": str(data.get("accountNumber", "")),
            "currency": str(data.get("currency", "")),
            "paymentLinkId": str(data.get("paymentLinkId", "")),
        }
        expected = _build_checksum(sign_fields, settings.PAYOS_CHECKSUM_KEY)
        incoming = payload.get("signature", "")
        return hmac.compare_digest(expected.lower(), incoming.lower())

    async def parse_webhook(self, payload: dict) -> ParsedPaymentWebhook:
        data = payload.get("data", {})
        code = payload.get("code", "")
        status = "PAID" if code == "00" else "CANCELLED"

        return ParsedPaymentWebhook(
            provider_order_code=str(data.get("orderCode", "")),
            amount_vnd=int(data.get("amount", 0)),
            status=status,
            transaction_id=data.get("reference"),
            payment_link_id=data.get("paymentLinkId"),
            raw_payload=payload,
        )
