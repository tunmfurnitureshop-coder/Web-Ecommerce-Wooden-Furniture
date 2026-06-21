import { cn } from "@/lib/utils";
import { Divider } from "../primitives/divider";

interface CartSummaryProps {
  subtotalFormatted: string;
  totalFormatted: string;
  shippingLabel?: string;
  shippingValue?: string;
  className?: string;
  subtotalLabel?: string;
  totalLabel?: string;
}

export function CartSummary({
  subtotalFormatted, totalFormatted,
  shippingLabel = "Shipping", shippingValue,
  subtotalLabel = "Subtotal", totalLabel = "Total",
  className,
}: CartSummaryProps) {
  return (
    <div className={cn("rounded-lg border border-border-default bg-surface p-5 flex flex-col gap-3", className)}>
      <div className="flex items-center justify-between text-sm">
        <span className="text-text-secondary">{subtotalLabel}</span>
        <span className="font-medium text-text-primary">{subtotalFormatted}</span>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-text-secondary">{shippingLabel}</span>
        <span className="text-text-muted">{shippingValue ?? "—"}</span>
      </div>
      <Divider />
      <div className="flex items-center justify-between">
        <span className="font-semibold text-text-primary">{totalLabel}</span>
        <span className="text-lg font-bold text-text-primary">{totalFormatted}</span>
      </div>
    </div>
  );
}
