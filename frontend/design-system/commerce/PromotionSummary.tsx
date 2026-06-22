import { PromotionBadge } from "./PromotionBadge";

interface PromotionSummaryProps {
  promotionLabel: string;
  promotionCode?: string | null;
  discountFormatted: string;
  discountLabel: string;
}

export function PromotionSummary({
  promotionLabel,
  promotionCode,
  discountFormatted,
  discountLabel,
}: PromotionSummaryProps) {
  return (
    <div className="rounded-lg border border-border-default bg-brand-soft/30 p-3 flex flex-col gap-2">
      <PromotionBadge label={promotionLabel} code={promotionCode} />
      <div className="flex items-center justify-between text-sm">
        <span className="text-text-secondary">{discountLabel}</span>
        <span className="font-semibold text-success">-{discountFormatted}</span>
      </div>
    </div>
  );
}
