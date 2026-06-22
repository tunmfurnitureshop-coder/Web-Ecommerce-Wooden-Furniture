import { Divider } from "../primitives/divider";

interface DiscountBreakdownProps {
  subtotalFormatted: string;
  discountFormatted: string;
  totalFormatted: string;
  subtotalLabel: string;
  discountLabel: string;
  totalLabel: string;
  shippingLabel?: string;
  shippingValue?: string;
}

export function DiscountBreakdown({
  subtotalFormatted,
  discountFormatted,
  totalFormatted,
  subtotalLabel,
  discountLabel,
  totalLabel,
  shippingLabel,
  shippingValue,
}: DiscountBreakdownProps) {
  return (
    <div className="rounded-lg border border-border-default bg-surface p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between text-sm">
        <span className="text-text-secondary">{subtotalLabel}</span>
        <span className="text-text-primary">{subtotalFormatted}</span>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-text-secondary">{discountLabel}</span>
        <span className="font-medium text-success">-{discountFormatted}</span>
      </div>
      {shippingLabel && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-text-secondary">{shippingLabel}</span>
          <span className="text-text-muted">{shippingValue ?? "—"}</span>
        </div>
      )}
      <Divider />
      <div className="flex items-center justify-between">
        <span className="font-semibold text-text-primary">{totalLabel}</span>
        <span className="text-lg font-bold text-text-primary">{totalFormatted}</span>
      </div>
    </div>
  );
}
