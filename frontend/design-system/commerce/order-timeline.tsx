import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface TimelineStep {
  label: string;
  description?: string;
  completedAt?: string;
  isActive: boolean;
  isCompleted: boolean;
}

interface OrderTimelineProps {
  steps: TimelineStep[];
  className?: string;
}

export function OrderTimeline({ steps, className }: OrderTimelineProps) {
  return (
    <ol className={cn("flex flex-col gap-0", className)} aria-label="Order status timeline">
      {steps.map((step, i) => {
        const isLast = i === steps.length - 1;
        return (
          <li key={i} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold",
                  step.isCompleted
                    ? "border-success bg-success text-text-inverse"
                    : step.isActive
                    ? "border-brand bg-brand-soft text-brand"
                    : "border-border-default bg-surface text-text-muted"
                )}
                aria-hidden
              >
                {step.isCompleted ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </div>
              {!isLast && (
                <div className={cn("w-0.5 flex-1 my-1", step.isCompleted ? "bg-success" : "bg-border-default")} aria-hidden />
              )}
            </div>
            <div className={cn("pb-6", isLast && "pb-0")}>
              <p className={cn(
                "text-sm font-medium",
                step.isActive ? "text-brand" : step.isCompleted ? "text-text-primary" : "text-text-muted"
              )}>
                {step.label}
              </p>
              {step.description && (
                <p className="text-xs text-text-muted mt-0.5">{step.description}</p>
              )}
              {step.completedAt && (
                <p className="text-xs text-text-muted mt-0.5">{step.completedAt}</p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
