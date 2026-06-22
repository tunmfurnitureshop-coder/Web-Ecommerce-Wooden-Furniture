export interface AppliedPromotionViewModel {
  id: string;
  code: string | null;
  name: string;
  trigger: string;
  discountType: string;
  discountVnd: number;
  discountFormatted: string;
  selectionReason: string;
}

export interface CartQuoteViewModel {
  merchandiseSubtotalVnd: number;
  merchandiseSubtotalFormatted: string;
  promotionDiscountVnd: number;
  promotionDiscountFormatted: string;
  totalVnd: number;
  totalFormatted: string;
  appliedPromotion: AppliedPromotionViewModel | null;
  hasDiscount: boolean;
}
