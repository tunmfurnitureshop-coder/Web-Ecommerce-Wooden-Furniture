import type { CartItem } from "@/features/cart/cart.types";

export interface CartQuoteRequest {
  locale: string;
  items: CartItem[];
  couponCode?: string;
  paymentMethod?: string;
}

export interface AppliedPromotionOut {
  id: string;
  code?: string | null;
  name: string;
  trigger: string;
  scopeType: string;
  discountType: string;
  discountVnd: number;
  selectionReason: string;
}

export interface CartQuoteLineItem {
  productId: string;
  quantity: number;
  unitPriceVnd: number;
  lineTotalVnd: number;
  promotionDiscountVnd: number;
  finalLineTotalVnd: number;
}

export interface CartQuoteResponse {
  locale: string;
  items: CartQuoteLineItem[];
  merchandiseSubtotalVnd: number;
  promotionDiscountVnd: number;
  totalVnd: number;
  currency: string;
  appliedPromotion: AppliedPromotionOut | null;
  couponError?: string | null;
}

export interface CouponApplyResult {
  applied: boolean;
  promotion: AppliedPromotionOut | null;
  errorMessage: string | null;
}
