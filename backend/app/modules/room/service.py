from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.modules.product.models import RoomCategory, RoomCategoryTranslation
from app.modules.room.schemas import (
    RoomOut, RoomListResponse, AdminRoomOut, AdminRoomListResponse,
)
from app.core.exceptions import not_found


def _pick_translation(
    translations: list[RoomCategoryTranslation], locale: str
) -> Optional[RoomCategoryTranslation]:
    """Translation for the requested locale, falling back to the first available."""
    for t in translations:
        if t.locale == locale:
            return t
    return translations[0] if translations else None


async def list_rooms(db: AsyncSession, locale: str = "vi") -> RoomListResponse:
    """Active room categories with localized name + slug — drives the homepage rail."""
    rooms = (await db.execute(
        select(RoomCategory)
        .where(RoomCategory.is_active == True)  # noqa: E712
        .order_by(RoomCategory.sort_order)
    )).scalars().all()
    items: list[RoomOut] = []
    for room in rooms:
        tr = _pick_translation(room.translations, locale)
        if not tr:
            continue
        items.append(RoomOut(
            code=room.code, slug=tr.slug, name=tr.name, imageUrl=room.image_url,
        ))
    return RoomListResponse(items=items)


async def admin_list_rooms(db: AsyncSession, locale: str = "vi") -> AdminRoomListResponse:
    rooms = (await db.execute(
        select(RoomCategory).order_by(RoomCategory.sort_order)
    )).scalars().all()
    items: list[AdminRoomOut] = []
    for room in rooms:
        tr = _pick_translation(room.translations, locale)
        items.append(AdminRoomOut(
            id=room.id, code=room.code,
            name=tr.name if tr else room.code,
            imageUrl=room.image_url,
            sortOrder=room.sort_order, isActive=room.is_active,
        ))
    return AdminRoomListResponse(items=items)


async def admin_update_room(
    db: AsyncSession, room_id: str, image_url: Optional[str], locale: str = "vi"
) -> AdminRoomOut:
    room = (await db.execute(
        select(RoomCategory).where(RoomCategory.id == room_id)
    )).scalar_one_or_none()
    if not room:
        raise not_found("Room category")
    room.image_url = image_url
    await db.commit()
    await db.refresh(room)
    tr = _pick_translation(room.translations, locale)
    return AdminRoomOut(
        id=room.id, code=room.code,
        name=tr.name if tr else room.code,
        imageUrl=room.image_url,
        sortOrder=room.sort_order, isActive=room.is_active,
    )
