import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface CheckoutSubmitButtonProps {
  loading: boolean;
  disabled?: boolean;
  label: string;
  loadingLabel: string;
  className?: string;
}

export function CheckoutSubmitButton({
  loading,
  disabled,
  label,
  loadingLabel,
  className,
}: CheckoutSubmitButtonProps) {
  return (
    <button
      type="submit"
      disabled={loading || disabled}
      className={cn(
        "w-full flex items-center justify-center gap-2 rounded-lg bg-brand px-6 py-3 text-base font-semibold text-text-inverse",
        "hover:opacity-90 disabled:opacity-50 transition-opacity",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus",
        className
      )}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
      {loading ? loadingLabel : label}
    </button>
  );
}
