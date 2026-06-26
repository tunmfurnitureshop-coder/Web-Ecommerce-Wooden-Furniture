import type { ReactNode } from "react";
import { Skeleton } from "./skeleton";
import { ErrorState } from "./error-state";
import { EmptyState } from "./empty-state";

export type PageStatus = "loading" | "error" | "ready";

interface PageStateProps {
  /** Async lifecycle state — pair with `usePageData`. */
  status: PageStatus;
  /** When `ready` but there is nothing to show. Empty UI only renders if `emptyTitle` is given. */
  isEmpty?: boolean;
  children: ReactNode;

  /* Loading */
  loadingFallback?: ReactNode;
  skeletonRows?: number;

  /* Error (falls back to ErrorState's own defaults if omitted) */
  errorTitle?: string;
  errorDescription?: string;
  onRetry?: () => void;
  retryLabel?: string;

  /* Empty */
  emptyIcon?: ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
}

function DefaultSkeleton({ rows }: { rows: number }) {
  return (
    <div className="flex flex-col gap-3" aria-busy>
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  );
}

/**
 * Standard loading / error / empty / ready switch for data-backed pages.
 * Composes Skeleton, ErrorState and EmptyState so every list/detail page
 * gets consistent feedback instead of bare text or swallowed errors.
 */
export function PageState({
  status,
  isEmpty,
  children,
  loadingFallback,
  skeletonRows = 5,
  errorTitle,
  errorDescription,
  onRetry,
  retryLabel,
  emptyIcon,
  emptyTitle,
  emptyDescription,
  emptyAction,
}: PageStateProps) {
  if (status === "loading") {
    return <>{loadingFallback ?? <DefaultSkeleton rows={skeletonRows} />}</>;
  }

  if (status === "error") {
    return (
      <ErrorState
        title={errorTitle}
        description={errorDescription}
        onRetry={onRetry}
        retryLabel={retryLabel}
      />
    );
  }

  if (isEmpty && emptyTitle) {
    return (
      <EmptyState
        icon={emptyIcon}
        title={emptyTitle}
        description={emptyDescription}
        action={emptyAction}
      />
    );
  }

  return <>{children}</>;
}
