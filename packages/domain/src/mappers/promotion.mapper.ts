import type {
  AppliedPromotionViewModel,
  CartQuoteViewModel,
} from "../view-models/promotion.view-model";

interface AppliedPromotionDTO {
  id: string;
  code?: string | null;
  name: string;
  trigger: string;
  discountType: string;
  discountVnd: number;
  selectionReason: string;
}

interface CartQuoteDTO {
  merchandiseSubtotalVnd: number;
  promotionDiscountVnd: number;
  totalVnd: number;
  appliedPromotion: AppliedPromotionDTO | null;
}

export function mapAppliedPromotionDTOtoViewModel(
  dto: AppliedPromotionDTO,
  formatCurrency: (n: number) => string
): AppliedPromotionViewModel {
  return {
    id: dto.id,
    code: dto.code ?? null,
    name: dto.name,
    trigger: dto.trigger,
    discountType: dto.discountType,
    discountVnd: dto.discountVnd,
    discountFormatted: formatCurrency(dto.discountVnd),
    selectionReason: dto.selectionReason,
  };
}

export function mapCartQuoteDTOtoViewModel(
  dto: CartQuoteDTO,
  formatCurrency: (n: number) => string
): CartQuoteViewModel {
  return {
    merchandiseSubtotalVnd: dto.merchandiseSubtotalVnd,
    merchandiseSubtotalFormatted: formatCurrency(dto.merchandiseSubtotalVnd),
    promotionDiscountVnd: dto.promotionDiscountVnd,
    promotionDiscountFormatted: formatCurrency(dto.promotionDiscountVnd),
    totalVnd: dto.totalVnd,
    totalFormatted: formatCurrency(dto.totalVnd),
    appliedPromotion: dto.appliedPromotion
      ? mapAppliedPromotionDTOtoViewModel(dto.appliedPromotion, formatCurrency)
      : null,
    hasDiscount: dto.promotionDiscountVnd > 0,
  };
}
