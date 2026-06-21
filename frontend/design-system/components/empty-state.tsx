import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-4 py-16 text-center", className)}>
      {icon && (
        <div className="text-text-muted" aria-hidden>
          {icon}
        </div>
      )}
      <div className="flex flex-col gap-1">
        <p className="text-lg font-semibold text-text-primary">{title}</p>
        {description && <p className="text-sm text-text-muted max-w-sm">{description}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
