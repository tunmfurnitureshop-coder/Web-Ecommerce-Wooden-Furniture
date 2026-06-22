import { formatCurrency } from "@/lib/format-currency";
import type { AppliedPromotionOut } from "./promotion.types";

export interface PromotionBadgeViewModel {
  label: string;
  discountFormatted: string;
  code: string | null;
  trigger: string;
}

export function mapAppliedPromotionToViewModel(
  promo: AppliedPromotionOut
): PromotionBadgeViewModel {
  return {
    label: promo.name,
    discountFormatted: formatCurrency(promo.discountVnd),
    code: promo.code ?? null,
    trigger: promo.trigger,
  };
}
