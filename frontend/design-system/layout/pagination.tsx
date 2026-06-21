"use client";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function Pagination({ page, totalPages, onPageChange, className }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
    if (totalPages <= 7) return i + 1;
    if (page <= 4) return i + 1;
    if (page >= totalPages - 3) return totalPages - 6 + i;
    return page - 3 + i;
  });

  const btnBase = cn(
    "inline-flex h-9 min-w-[2.25rem] items-center justify-center rounded-md border px-2 text-sm font-medium transition-colors",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-1",
    "disabled:opacity-40 disabled:pointer-events-none"
  );

  return (
    <nav aria-label="Pagination" className={cn("flex items-center gap-1", className)}>
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        aria-label="Previous page"
        className={cn(btnBase, "border-border-default text-text-secondary hover:bg-surface-muted")}
      >
        <ChevronLeft className="h-4 w-4" aria-hidden />
      </button>

      {pages.map((p) => (
        <button
          key={p}
          onClick={() => onPageChange(p)}
          aria-label={`Page ${p}`}
          aria-current={p === page ? "page" : undefined}
          className={cn(
            btnBase,
            p === page
              ? "border-brand bg-brand text-text-inverse"
              : "border-border-default text-text-secondary hover:bg-surface-muted"
          )}
        >
          {p}
        </button>
      ))}

      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        aria-label="Next page"
        className={cn(btnBase, "border-border-default text-text-secondary hover:bg-surface-muted")}
      >
        <ChevronRight className="h-4 w-4" aria-hidden />
      </button>
    </nav>
  );
}
