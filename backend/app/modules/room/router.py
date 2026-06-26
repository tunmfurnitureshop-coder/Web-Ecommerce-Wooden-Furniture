from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.modules.room import service
from app.modules.room.schemas import (
    RoomListResponse, AdminRoomListResponse, AdminRoomOut, AdminUpdateRoomRequest,
)
from app.modules.auth.dependencies import require_admin

router = APIRouter(tags=["rooms"])
admin_router = APIRouter(tags=["admin-rooms"])


@router.get("/rooms", response_model=RoomListResponse)
async def list_rooms(
    locale: str = Query("vi"),
    db: AsyncSession = Depends(get_db),
):
    return await service.list_rooms(db, locale=locale)


@admin_router.get("/rooms", response_model=AdminRoomListResponse)
async def admin_list_rooms(
    locale: str = Query("vi"),
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(require_admin),
):
    return await service.admin_list_rooms(db, locale=locale)


@admin_router.patch("/rooms/{room_id}", response_model=AdminRoomOut)
async def admin_update_room(
    room_id: str,
    body: AdminUpdateRoomRequest,
    locale: str = Query("vi"),
    db: AsyncSession = Depends(get_db),
    _: dict = Depends(require_admin),
):
    return await service.admin_update_room(db, room_id, body.imageUrl, locale=locale)
