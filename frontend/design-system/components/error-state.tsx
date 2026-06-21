"use client";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}

export function ErrorState({
  title = "Something went wrong",
  description,
  onRetry,
  retryLabel = "Try again",
  className,
}: ErrorStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-4 py-16 text-center", className)}>
      <AlertCircle className="h-10 w-10 text-danger" aria-hidden />
      <div className="flex flex-col gap-1">
        <p className="text-lg font-semibold text-text-primary">{title}</p>
        {description && <p className="text-sm text-text-muted max-w-sm">{description}</p>}
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-sm font-medium text-brand underline underline-offset-4 hover:text-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus rounded-sm"
        >
          {retryLabel}
        </button>
      )}
    </div>
  );
}
