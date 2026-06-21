import re
from pydantic import BaseModel, field_validator
from typing import Optional, Dict, List
from app.shared.enums import CollectionStatus


class CollectionTranslationIn(BaseModel):
    name: str
    slug: str
    short_description: Optional[str] = None
    description_markdown: Optional[str] = None
    meta_title: Optional[str] = None
    meta_description: Optional[str] = None
    og_title: Optional[str] = None
    og_description: Optional[str] = None
    og_image_url: Optional[str] = None


class CollectionCreateRequest(BaseModel):
    code: str
    status: CollectionStatus = CollectionStatus.DRAFT
    cover_image_url: Optional[str] = None
    sort_order: int = 0
    is_featured: bool = False
    translations: Dict[str, CollectionTranslationIn]

    @field_validator("code")
    @classmethod
    def code_must_be_snake_case(cls, v: str) -> str:
        if not re.match(r"^[a-z][a-z0-9_]*$", v):
            raise ValueError("Collection code must be lowercase snake_case")
        return v

    @field_validator("translations")
    @classmethod
    def vi_translation_required(cls, v: Dict) -> Dict:
        if "vi" not in v:
            raise ValueError("Vietnamese translation (vi) is required")
        return v


class CollectionUpdateRequest(BaseModel):
    status: Optional[CollectionStatus] = None
    cover_image_url: Optional[str] = None
    sort_order: Optional[int] = None
    is_featured: Optional[bool] = None
    translations: Optional[Dict[str, CollectionTranslationIn]] = None


class CollectionProductAddRequest(BaseModel):
    product_id: str
    sort_order: int = 0


class CollectionProductReorderItem(BaseModel):
    product_id: str
    sort_order: int


class CollectionProductReorderRequest(BaseModel):
    items: List[CollectionProductReorderItem]


# ── Response shapes ──────────────────────────────────────────────────────────

class SeoOut(BaseModel):
    meta_title: Optional[str] = None
    meta_description: Optional[str] = None
    og_title: Optional[str] = None
    og_description: Optional[str] = None
    og_image_url: Optional[str] = None


class BreadcrumbItem(BaseModel):
    name: str
    href: str


class CollectionProductItem(BaseModel):
    id: str
    sku: str
    name: str
    slug: str
    primary_image_url: Optional[str] = None
    base_price_vnd: int
    sort_order: int


class CollectionListItem(BaseModel):
    id: str
    code: str
    slug: str
    name: str
    short_description: Optional[str] = None
    cover_image_url: Optional[str] = None
    is_featured: bool
    product_count: int


class CollectionDetailOut(BaseModel):
    id: str
    code: str
    name: str
    slug: str
    short_description: Optional[str] = None
    description_markdown: Optional[str] = None
    cover_image_url: Optional[str] = None
    seo: SeoOut
    products: List[CollectionProductItem]
    breadcrumbs: List[BreadcrumbItem]


class CollectionListResponse(BaseModel):
    items: List[CollectionListItem]


class CollectionAdminItem(BaseModel):
    id: str
    code: str
    status: str
    is_featured: bool
    sort_order: int
    cover_image_url: Optional[str] = None
    translations: List[dict]
    product_count: int


class CollectionAdminListResponse(BaseModel):
    items: List[CollectionAdminItem]
