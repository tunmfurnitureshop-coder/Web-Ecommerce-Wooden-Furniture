import { useTranslations } from "next-intl";
import { formatVnd } from "@/lib/format-currency";
import { Separator } from "@/components/ui/separator";
import type { PricingQuoteResponse } from "@/features/product/product.types";

interface Props {
  quote: PricingQuoteResponse;
  loading?: boolean;
}

export function PriceBreakdown({ quote, loading }: Props) {
  const t = useTranslations("product");
  return (
    <div className={`bg-secondary rounded-lg p-4 space-y-2 text-sm transition-opacity ${loading ? "opacity-50" : ""}`}>
      <h4 className="font-semibold">{t("priceBreakdown")}</h4>
      <div className="flex justify-between text-muted-foreground">
        <span>{t("basePrice")}</span>
        <span>{formatVnd(quote.breakdown.basePriceVnd)}</span>
      </div>
      {quote.breakdown.woodTypeDeltaVnd !== 0 && (
        <div className="flex justify-between text-muted-foreground">
          <span>{t("woodTypeDelta")}</span>
          <span>+{formatVnd(quote.breakdown.woodTypeDeltaVnd)}</span>
        </div>
      )}
      {quote.breakdown.finishDeltaVnd !== 0 && (
        <div className="flex justify-between text-muted-foreground">
          <span>{t("finishDelta")}</span>
          <span>+{formatVnd(quote.breakdown.finishDeltaVnd)}</span>
        </div>
      )}
      {quote.breakdown.sizeDeltaVnd !== 0 && (
        <div className="flex justify-between text-muted-foreground">
          <span>{t("sizeDelta")}</span>
          <span>+{formatVnd(quote.breakdown.sizeDeltaVnd)}</span>
        </div>
      )}
      <Separator />
      <div className="flex justify-between font-bold text-base">
        <span>{t("totalPrice")}</span>
        <span className="text-primary">{formatVnd(quote.unitPriceVnd)}</span>
      </div>
      {quote.quantity > 1 && (
        <p className="text-muted-foreground text-xs">× {quote.quantity} = {formatVnd(quote.lineTotalVnd)}</p>
      )}
    </div>
  );
}
