import re
from pydantic import BaseModel, field_validator
from typing import Optional, Dict, List
from app.shared.enums import TagType


class TagTranslationIn(BaseModel):
    name: str
    slug: str
    description: Optional[str] = None


class TagCreateRequest(BaseModel):
    code: str
    type: TagType
    is_active: bool = True
    sort_order: int = 0
    translations: Dict[str, TagTranslationIn]

    @field_validator("code")
    @classmethod
    def code_must_be_snake_case(cls, v: str) -> str:
        if not re.match(r"^[a-z][a-z0-9_]*$", v):
            raise ValueError("Tag code must be lowercase snake_case (e.g. 'walnut', 'six_seats')")
        return v

    @field_validator("translations")
    @classmethod
    def vi_translation_required(cls, v: Dict) -> Dict:
        if "vi" not in v:
            raise ValueError("Vietnamese translation (vi) is required")
        return v


class TagUpdateRequest(BaseModel):
    is_active: Optional[bool] = None
    sort_order: Optional[int] = None
    translations: Optional[Dict[str, TagTranslationIn]] = None


class TagTranslationOut(BaseModel):
    locale: str
    name: str
    slug: str
    description: Optional[str] = None


class TagOut(BaseModel):
    id: str
    code: str
    type: str
    is_active: bool
    sort_order: int
    name: str
    slug: str
    description: Optional[str] = None


class TagAdminOut(BaseModel):
    id: str
    code: str
    type: str
    is_active: bool
    sort_order: int
    translations: List[TagTranslationOut]


class TagListResponse(BaseModel):
    items: List[TagOut]


class TagAdminListResponse(BaseModel):
    items: List[TagAdminOut]
