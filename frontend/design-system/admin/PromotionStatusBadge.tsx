import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: "bg-success-bg text-success",
  DRAFT: "bg-surface-muted text-text-muted",
  PAUSED: "bg-warning-bg text-warning",
  EXPIRED: "bg-danger-bg text-danger",
};

interface PromotionStatusBadgeProps {
  status: string;
}

export function PromotionStatusBadge({ status }: PromotionStatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-block rounded-full px-2.5 py-0.5 text-xs font-medium",
        STATUS_STYLES[status] ?? "bg-surface-muted text-text-muted"
      )}
    >
      {status}
    </span>
  );
}
