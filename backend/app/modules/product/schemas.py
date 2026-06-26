from pydantic import BaseModel, ConfigDict
from typing import Optional, List, Dict, Any
from app.modules.campaign.schemas import CampaignBannerOut


class RoomOut(BaseModel):
    code: str
    name: str


class ProductCatalogItem(BaseModel):
    id: str
    sku: str
    name: str
    slug: str
    shortDescription: Optional[str] = None
    basePriceVnd: int
    primaryImageUrl: Optional[str] = None
    room: RoomOut


class AppliedFilters(BaseModel):
    room: Optional[str] = None
    woodType: Optional[str] = None
    minPrice: Optional[int] = None
    maxPrice: Optional[int] = None
    sort: Optional[str] = None
    tags: Optional[List[str]] = None
    availability: Optional[str] = None
    ratingMin: Optional[float] = None


class TagFilterItem(BaseModel):
    code: str
    type: str
    name: str


class PriceRangeOut(BaseModel):
    min: int
    max: int


class AvailableFilters(BaseModel):
    tags: List[TagFilterItem] = []
    priceRange: Optional[PriceRangeOut] = None


class FallbackSuggestions(BaseModel):
    suggestedCategories: List[dict] = []
    suggestedCollections: List[dict] = []
    suggestedGuides: List[dict] = []


class ProductCatalogResponse(BaseModel):
    items: List[ProductCatalogItem]
    page: int
    pageSize: int
    total: int
    query: Optional[str] = None
    appliedFilters: Optional[AppliedFilters] = None
    availableFilters: Optional[AvailableFilters] = None
    fallback: Optional[FallbackSuggestions] = None
    campaignBanner: Optional[CampaignBannerOut] = None


class WoodTypeOptionOut(BaseModel):
    code: str
    name: str
    priceDeltaVnd: int


class FinishOptionOut(BaseModel):
    code: str
    name: str
    priceDeltaVnd: int
    imageUrl: Optional[str] = None


class SizeOptionOut(BaseModel):
    code: str
    name: str
    widthCm: Optional[int] = None
    depthCm: Optional[int] = None
    heightCm: Optional[int] = None
    priceDeltaVnd: int


class AvailableOptions(BaseModel):
    woodTypes: List[WoodTypeOptionOut]
    finishes: List[FinishOptionOut]
    sizes: List[SizeOptionOut]


class ProductImageItem(BaseModel):
    id: str
    imageUrl: str
    altText: Optional[str] = None
    sortOrder: int
    isPrimary: bool
    linkedFinishCode: Optional[str] = None


class ProductSeoOut(BaseModel):
    meta_title: Optional[str] = None
    meta_description: Optional[str] = None
    og_title: Optional[str] = None
    og_description: Optional[str] = None
    og_image_url: Optional[str] = None
    canonical_url: Optional[str] = None


class ProductDetailOut(BaseModel):
    id: str
    sku: str
    name: str
    slug: str
    description: Optional[str] = None
    shortDescription: Optional[str] = None
    specifications: Optional[Dict[str, Any]] = None
    basePriceVnd: int
    primaryImageUrl: Optional[str] = None
    availableOptions: AvailableOptions
    images: List["ProductImageItem"] = []
    seo: Optional[ProductSeoOut] = None
    jsonLd: Optional[Dict[str, Any]] = None


class TranslationIn(BaseModel):
    name: str
    slug: str
    shortDescription: Optional[str] = None
    description: Optional[str] = None
    specifications: Optional[Dict[str, Any]] = None


class OptionCodesIn(BaseModel):
    woodTypes: List[str]
    finishes: List[str]
    sizes: List[str]


class InventoryIn(BaseModel):
    totalQty: int = 0


class CreateProductRequest(BaseModel):
    sku: str
    roomCategoryCode: str
    basePriceVnd: int
    primaryImageUrl: Optional[str] = None
    status: str = "ACTIVE"
    translations: Dict[str, TranslationIn]
    optionCodes: OptionCodesIn
    inventory: InventoryIn
    tagCodes: List[str] = []


class UpdateProductRequest(BaseModel):
    sku: Optional[str] = None
    roomCategoryCode: Optional[str] = None
    basePriceVnd: Optional[int] = None
    primaryImageUrl: Optional[str] = None
    status: Optional[str] = None
    translations: Optional[Dict[str, TranslationIn]] = None
    optionCodes: Optional[OptionCodesIn] = None
    inventory: Optional[InventoryIn] = None
    tagCodes: Optional[List[str]] = None


class InventoryOut(BaseModel):
    totalQty: int
    reservedQty: int
    availableQty: int


class AdminProductItem(BaseModel):
    id: str
    sku: str
    nameVi: str
    basePriceVnd: int
    status: str
    inventory: InventoryOut


class AdminProductListResponse(BaseModel):
    items: List[AdminProductItem]
