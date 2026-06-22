import json
from pydantic import BaseModel, field_validator
from typing import Optional, Any
from datetime import datetime

_CLIENT_EVENTS = {
    "PRODUCT_VIEWED", "SEARCH_PERFORMED", "SEARCH_RESULT_CLICKED",
    "PRODUCT_ADDED_TO_CART", "PRODUCT_REMOVED_FROM_CART",
    "CART_VIEWED", "CHECKOUT_STARTED", "WISHLIST_ADDED", "WISHLIST_REMOVED",
}

_MAX_PAYLOAD_BYTES = 8 * 1024  # 8 KB


class ClientEventRequest(BaseModel):
    eventName: str
    anonymousId: Optional[str] = None
    sessionId: Optional[str] = None
    locale: Optional[str] = "vi"
    sourcePage: Optional[str] = None
    referrer: Optional[str] = None
    productId: Optional[str] = None
    campaignCode: Optional[str] = None
    payload: Optional[dict] = None

    @field_validator("eventName")
    @classmethod
    def validate_event_name(cls, v: str) -> str:
        if v not in _CLIENT_EVENTS:
            raise ValueError(f"Unknown event name: {v}. Allowed: {sorted(_CLIENT_EVENTS)}")
        return v

    @field_validator("anonymousId", "sessionId")
    @classmethod
    def max_128(cls, v: Optional[str]) -> Optional[str]:
        if v and len(v) > 128:
            raise ValueError("anonymousId/sessionId must be ≤ 128 characters.")
        return v

    @field_validator("sourcePage", "referrer")
    @classmethod
    def max_500(cls, v: Optional[str]) -> Optional[str]:
        if v and len(v) > 500:
            raise ValueError("sourcePage/referrer must be ≤ 500 characters.")
        return v

    @field_validator("payload")
    @classmethod
    def max_payload_size(cls, v: Optional[dict]) -> Optional[dict]:
        if v and len(json.dumps(v).encode()) > _MAX_PAYLOAD_BYTES:
            raise ValueError("payload must be ≤ 8 KB.")
        return v


class ClientEventResponse(BaseModel):
    accepted: bool = True
    eventId: str
    occurredAt: datetime
