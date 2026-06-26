import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type StatTone = "default" | "brand" | "warning" | "danger" | "success";

// Icon chip styling per tone — colour always pairs with an icon + label,
// so meaning is never conveyed by colour alone.
const TONE_CHIP: Record<StatTone, string> = {
  default: "bg-surface-muted text-text-secondary",
  brand: "bg-brand-soft text-brand",
  warning: "bg-warning-bg text-warning",
  danger: "bg-danger-bg text-danger",
  success: "bg-success-bg text-success",
};

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  tone?: StatTone;
  hint?: string;
  /** Larger hero treatment for primary KPIs. */
  emphasis?: boolean;
}

/** Admin metric card: icon chip + label + value, on semantic tokens. */
export function StatCard({ label, value, icon: Icon, tone = "default", hint, emphasis }: StatCardProps) {
  return (
    <div
      className={cn(
        "flex items-start gap-4 rounded-lg border border-border-default p-5",
        emphasis ? "bg-surface-subtle" : "bg-surface"
      )}
    >
      <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-md", TONE_CHIP[tone])}>
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <div className="flex min-w-0 flex-col gap-1">
        <span className="text-xs font-medium text-text-muted">{label}</span>
        <span
          className={cn(
            "font-bold text-text-primary tabular-nums",
            emphasis ? "text-3xl" : "text-2xl"
          )}
        >
          {value}
        </span>
        {hint && <span className="text-xs text-text-muted">{hint}</span>}
      </div>
    </div>
  );
}
