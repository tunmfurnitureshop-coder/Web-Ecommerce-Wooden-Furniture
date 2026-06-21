from datetime import datetime
from pydantic import BaseModel, field_validator, model_validator
from typing import Optional, Dict, List
from app.shared.enums import ContentType, ContentStatus


class ContentTranslationIn(BaseModel):
    title: str
    slug: str
    excerpt: Optional[str] = None
    body_markdown: str
    meta_title: Optional[str] = None
    meta_description: Optional[str] = None
    og_title: Optional[str] = None
    og_description: Optional[str] = None
    og_image_url: Optional[str] = None

    @field_validator("title")
    @classmethod
    def title_max_length(cls, v: str) -> str:
        if len(v) > 180:
            raise ValueError("Title must be 180 characters or fewer")
        return v

    @field_validator("excerpt")
    @classmethod
    def excerpt_max_length(cls, v: Optional[str]) -> Optional[str]:
        if v and len(v) > 500:
            raise ValueError("Excerpt must be 500 characters or fewer")
        return v


class ContentCreateRequest(BaseModel):
    type: ContentType
    status: ContentStatus = ContentStatus.DRAFT
    cover_image_url: Optional[str] = None
    author_name: Optional[str] = None
    scheduled_at: Optional[datetime] = None
    translations: Dict[str, ContentTranslationIn]

    @field_validator("translations")
    @classmethod
    def vi_translation_required(cls, v: Dict) -> Dict:
        if "vi" not in v:
            raise ValueError("Vietnamese translation (vi) is required")
        vi = v["vi"]
        if not vi.title or not vi.slug or not vi.body_markdown:
            raise ValueError("Vietnamese translation requires title, slug, and body_markdown")
        return v

    @model_validator(mode="after")
    def validate_status_fields(self) -> "ContentCreateRequest":
        if self.status == ContentStatus.PUBLISHED and not self.cover_image_url:
            raise ValueError("cover_image_url is required for published content")
        if self.status == ContentStatus.SCHEDULED and not self.scheduled_at:
            raise ValueError("scheduled_at is required when status is SCHEDULED")
        return self


class ContentUpdateRequest(BaseModel):
    status: Optional[ContentStatus] = None
    cover_image_url: Optional[str] = None
    author_name: Optional[str] = None
    scheduled_at: Optional[datetime] = None
    translations: Optional[Dict[str, ContentTranslationIn]] = None


class ContentProductLinkRequest(BaseModel):
    product_id: str
    sort_order: int = 0


class ContentCategoryLinkRequest(BaseModel):
    category_id: str


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


class LinkedProductItem(BaseModel):
    id: str
    name: str
    slug: str
    primary_image_url: Optional[str] = None
    base_price_vnd: int


class LinkedCategoryItem(BaseModel):
    code: str
    name: str
    slug: str


class RelatedGuideItem(BaseModel):
    id: str
    type: str
    title: str
    slug: str
    excerpt: Optional[str] = None
    cover_image_url: Optional[str] = None
    published_at: Optional[datetime] = None


class ContentListItem(BaseModel):
    id: str
    type: str
    title: str
    slug: str
    excerpt: Optional[str] = None
    cover_image_url: Optional[str] = None
    author_name: Optional[str] = None
    published_at: Optional[datetime] = None


class ContentDetailOut(BaseModel):
    id: str
    type: str
    title: str
    slug: str
    excerpt: Optional[str] = None
    body_markdown: str
    cover_image_url: Optional[str] = None
    author_name: Optional[str] = None
    published_at: Optional[datetime] = None
    linked_products: List[LinkedProductItem]
    linked_categories: List[LinkedCategoryItem]
    seo: SeoOut
    breadcrumbs: List[BreadcrumbItem]
    related_guides: List[RelatedGuideItem]


class ContentListResponse(BaseModel):
    items: List[ContentListItem]
    page: int
    page_size: int
    total: int


class ContentAdminItem(BaseModel):
    id: str
    type: str
    status: str
    cover_image_url: Optional[str] = None
    author_name: Optional[str] = None
    published_at: Optional[datetime] = None
    scheduled_at: Optional[datetime] = None
    translations: List[dict]


class ContentAdminListResponse(BaseModel):
    items: List[ContentAdminItem]
