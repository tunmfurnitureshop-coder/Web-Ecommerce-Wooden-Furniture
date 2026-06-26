from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class CampaignListItem(BaseModel):
    id: str
    code: str
    name: str
    slug: str
    heroImageUrl: Optional[str] = None
    mobileHeroImageUrl: Optional[str] = None
    startsAt: datetime
    endsAt: Optional[datetime] = None


class CampaignListResponse(BaseModel):
    items: List[CampaignListItem]


class FeaturedProductItem(BaseModel):
    id: str
    name: str
    slug: str
    basePriceVnd: int
    heroImageUrl: Optional[str] = None


class FeaturedCollectionItem(BaseModel):
    id: str
    name: str
    slug: str
    imageUrl: Optional[str] = None


class CampaignDetailResponse(BaseModel):
    id: str
    code: str
    name: str
    slug: str
    shortDescription: Optional[str] = None
    descriptionMarkdown: Optional[str] = None
    heroImageUrl: Optional[str] = None
    mobileHeroImageUrl: Optional[str] = None
    startsAt: datetime
    endsAt: Optional[datetime] = None
    products: List[FeaturedProductItem] = []
    collections: List[FeaturedCollectionItem] = []
    metaTitle: Optional[str] = None
    metaDescription: Optional[str] = None
    ogTitle: Optional[str] = None
    ogDescription: Optional[str] = None
    ogImageUrl: Optional[str] = None


class AdminCreateCampaignRequest(BaseModel):
    code: str
    status: str = "DRAFT"
    heroImageUrl: Optional[str] = None
    mobileHeroImageUrl: Optional[str] = None
    placement: Optional[str] = None
    targetType: Optional[str] = None  # CampaignTargetType: COLLECTION | CATEGORY
    targetId: Optional[str] = None
    displayPriority: int = 100
    startsAt: datetime
    endsAt: Optional[datetime] = None
    translations: List[dict] = []


class AdminPatchCampaignRequest(BaseModel):
    status: Optional[str] = None
    heroImageUrl: Optional[str] = None
    mobileHeroImageUrl: Optional[str] = None
    placement: Optional[str] = None
    targetType: Optional[str] = None
    targetId: Optional[str] = None
    displayPriority: Optional[int] = None
    startsAt: Optional[datetime] = None
    endsAt: Optional[datetime] = None
