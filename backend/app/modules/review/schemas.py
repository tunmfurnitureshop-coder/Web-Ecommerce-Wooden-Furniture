from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, field_validator


class ReviewSubmitRequest(BaseModel):
    rating: int = Field(..., ge=1, le=5)
    title: Optional[str] = None
    content: Optional[str] = None

    @field_validator("title")
    @classmethod
    def validate_title(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and len(v) > 120:
            raise ValueError("Title must be at most 120 characters.")
        return v

    @field_validator("content")
    @classmethod
    def validate_content(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            if len(v) < 20:
                raise ValueError("Content must be at least 20 characters.")
            if len(v) > 2000:
                raise ValueError("Content must be at most 2000 characters.")
        return v


class ReviewUpdateRequest(BaseModel):
    rating: Optional[int] = Field(None, ge=1, le=5)
    title: Optional[str] = None
    content: Optional[str] = None

    @field_validator("title")
    @classmethod
    def validate_title(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and len(v) > 120:
            raise ValueError("Title must be at most 120 characters.")
        return v

    @field_validator("content")
    @classmethod
    def validate_content(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            if len(v) < 20:
                raise ValueError("Content must be at least 20 characters.")
            if len(v) > 2000:
                raise ValueError("Content must be at most 2000 characters.")
        return v


class ReviewOut(BaseModel):
    id: str
    customerName: str
    rating: int
    title: Optional[str]
    content: Optional[str]
    isVerifiedPurchase: bool
    createdAt: datetime

    model_config = {"from_attributes": True}


class ReviewSummaryOut(BaseModel):
    averageRating: float
    reviewCount: int
    distribution: dict[str, int]


class ProductReviewsResponse(BaseModel):
    summary: ReviewSummaryOut
    items: list[ReviewOut]
    page: int
    pageSize: int


class AdminReviewOut(BaseModel):
    id: str
    productId: str
    customerId: str
    customerEmail: str
    customerName: str
    rating: int
    title: Optional[str]
    content: Optional[str]
    status: str
    isVerifiedPurchase: bool
    createdAt: datetime

    model_config = {"from_attributes": True}


class AdminReviewListResponse(BaseModel):
    items: list[AdminReviewOut]
    total: int
    page: int
    pageSize: int


class AdminUpdateReviewStatusRequest(BaseModel):
    status: str
    note: Optional[str] = None
