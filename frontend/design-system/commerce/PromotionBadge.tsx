import { Tag } from "lucide-react";
import { cn } from "@/lib/utils";

interface PromotionBadgeProps {
  label: string;
  code?: string | null;
  className?: string;
}

export function PromotionBadge({ label, code, className }: PromotionBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full bg-brand-soft text-brand text-xs font-medium px-2.5 py-1",
        className
      )}
    >
      <Tag className="h-3 w-3 shrink-0" aria-hidden />
      {label}
      {code && <span className="font-mono opacity-75">{code}</span>}
    </span>
  );
}
