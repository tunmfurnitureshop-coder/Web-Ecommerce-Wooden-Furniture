from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.modules.auth.schemas import LoginRequest, TokenResponse
from app.modules.auth import service

router = APIRouter(prefix="/admin/auth", tags=["admin-auth"])


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest, db: AsyncSession = Depends(get_db)):
    token = await service.authenticate_admin(db, body.email, body.password)
    return TokenResponse(accessToken=token)
