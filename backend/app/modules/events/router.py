from fastapi import APIRouter, Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.security import decode_token
from app.modules.events.schemas import ClientEventRequest, ClientEventResponse
from app.modules.events import service

router = APIRouter(tags=["events"])

_optional_bearer = HTTPBearer(auto_error=False)


@router.post("/events", response_model=ClientEventResponse)
async def ingest_event(
    body: ClientEventRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(_optional_bearer),
):
    customer_id = None
    if credentials:
        payload = decode_token(credentials.credentials)
        if payload and payload.get("role") == "customer":
            customer_id = payload.get("sub")

    campaign_id = None
    if body.campaignCode:
        from app.modules.campaign.service import validate_campaign_code
        campaign = await validate_campaign_code(db, body.campaignCode)
        if campaign:
            campaign_id = campaign.id

    try:
        return await service.ingest_client_event(db, body, customer_id=customer_id, campaign_id=campaign_id)
    except Exception:
        # Event ingestion failure must not block customer UI
        import uuid
        from datetime import datetime, timezone
        return ClientEventResponse(eventId=str(uuid.uuid4()), occurredAt=datetime.now(timezone.utc))
