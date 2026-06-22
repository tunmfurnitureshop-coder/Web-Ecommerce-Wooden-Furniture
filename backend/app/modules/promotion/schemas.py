from pydantic import BaseModel
from typing import Optional, List


class CartQuoteItemIn(BaseModel):
    productId: str
    quantity: int
    selectedOptions: dict  # woodType, finish, size


class CartQuoteRequest(BaseModel):
    locale: str = "vi"
    paymentMethod: str
    couponCode: Optional[str] = None
    campaignCode: Optional[str] = None
    items: List[CartQuoteItemIn]


class QuotedCartItem(BaseModel):
    productId: str
    quantity: int
    unitPriceVnd: int
    lineTotalVnd: int
    promotionDiscountVnd: int
    finalLineTotalVnd: int


class AppliedPromotionOut(BaseModel):
    id: str
    code: Optional[str] = None
    name: str
    trigger: str
    discountType: str
    discountVnd: int
    selectionReason: str


class CouponResultOut(BaseModel):
    submittedCode: str
    status: str
    message: str


class CartQuoteResponse(BaseModel):
    items: List[QuotedCartItem]
    merchandiseSubtotalVnd: int
    promotionDiscountVnd: int
    shippingFeeVnd: int = 0
    shippingDiscountVnd: int = 0
    totalDiscountVnd: int
    totalVnd: int
    appliedPromotion: Optional[AppliedPromotionOut] = None
    coupon: Optional[CouponResultOut] = None
