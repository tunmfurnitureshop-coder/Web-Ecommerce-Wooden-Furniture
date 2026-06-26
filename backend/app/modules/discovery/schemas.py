from pydantic import BaseModel, field_validator
from typing import Optional, List


class RecentlyViewedHydrateRequest(BaseModel):
    locale: str = "vi"
    productIds: List[str]

    @field_validator("productIds")
    @classmethod
    def max_twelve(cls, v: List[str]) -> List[str]:
        return v[:12]


class RecentlyViewedItem(BaseModel):
    id: str
    name: str
    slug: str
    basePriceVnd: int
    primaryImageUrl: Optional[str] = None


class RelatedProductItem(BaseModel):
    id: str
    name: str
    slug: str
    basePriceVnd: int
    primaryImageUrl: Optional[str] = None
    relationSource: str  # "manual" | "category" | "tags" | "price_tier" | "latest"


class TagInfo(BaseModel):
    code: str
    type: str
    name: str
    slug: str


class SeoOut(BaseModel):
    meta_title: Optional[str] = None
    meta_description: Optional[str] = None
    og_title: Optional[str] = None
    og_description: Optional[str] = None
    og_image_url: Optional[str] = None


class BreadcrumbItem(BaseModel):
    name: str
    href: str


class CategoryProductItem(BaseModel):
    id: str
    name: str
    slug: str
    basePriceVnd: int
    primaryImageUrl: Optional[str] = None


class FeaturedCollectionItem(BaseModel):
    id: str
    name: str
    slug: str
    cover_image_url: Optional[str] = None


class CategoryLandingOut(BaseModel):
    code: str
    name: str
    slug: str
    description: Optional[str] = None
    seo: SeoOut
    breadcrumbs: List[BreadcrumbItem]
    featured_products: List[CategoryProductItem]
    available_tags: List[TagInfo]
    featured_collections: List[FeaturedCollectionItem]


class MaterialLandingOut(BaseModel):
    code: str
    name: str
    slug: str
    description: Optional[str] = None
    seo: SeoOut
    breadcrumbs: List[BreadcrumbItem]
    products: List[CategoryProductItem]
    related_guides: List[dict]


class SynonymCreateRequest(BaseModel):
    locale: str
    canonical_term: str
    synonym_term: str


class SynonymUpdateRequest(BaseModel):
    canonical_term: Optional[str] = None
    synonym_term: Optional[str] = None


class SynonymOut(BaseModel):
    id: str
    locale: str
    canonical_term: str
    synonym_term: str


class SynonymListResponse(BaseModel):
    items: List[SynonymOut]


class BestSellerListResponse(BaseModel):
    items: List[CategoryProductItem]
