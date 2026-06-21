from pydantic import BaseModel
from typing import Optional, List, Any


class SeoMetadataDTO(BaseModel):
    meta_title: Optional[str] = None
    meta_description: Optional[str] = None
    og_title: Optional[str] = None
    og_description: Optional[str] = None
    og_image_url: Optional[str] = None
    canonical_url: Optional[str] = None


class BreadcrumbItem(BaseModel):
    name: str
    href: str


class JsonLdDict(BaseModel):
    data: Any
