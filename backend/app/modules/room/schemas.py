from typing import Optional, List
from pydantic import BaseModel


class RoomOut(BaseModel):
    code: str
    slug: str
    name: str
    imageUrl: Optional[str] = None


class RoomListResponse(BaseModel):
    items: List[RoomOut]


class AdminRoomOut(BaseModel):
    id: str
    code: str
    name: str
    imageUrl: Optional[str] = None
    sortOrder: int
    isActive: bool


class AdminRoomListResponse(BaseModel):
    items: List[AdminRoomOut]


class AdminUpdateRoomRequest(BaseModel):
    imageUrl: Optional[str] = None
