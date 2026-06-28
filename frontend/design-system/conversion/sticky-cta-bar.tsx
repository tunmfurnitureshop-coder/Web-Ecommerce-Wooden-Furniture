import type { ReactNode } from "react";

interface StickyCtaBarProps {
  /** Optional formatted total shown on the left. */
  total?: string;
  /** Small label above the total (pass an i18n string). */
  totalLabel?: string;
  /** The action element — a Link>Button, or a type="submit" button. */
  children: ReactNode;
}

/**
 * Generic mobile (`<lg`) sticky action bar pinned to the viewport bottom. Used on
 * the cart + checkout funnel, where the bottom tab bar is already hidden (P1), so
 * it anchors at `bottom-0`. Renders a co-located in-flow spacer (same pattern as
 * the bottom nav) so page content always clears the fixed bar — no manual padding.
 */
export function StickyCtaBar({ total, totalLabel, children }: StickyCtaBarProps) {
  return (
    <>
      <div aria-hidden className="h-[calc(4.5rem+env(safe-area-inset-bottom))] lg:hidden" />
      <div className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-4 border-t border-border-default bg-surface px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-md lg:hidden">
        {total && (
          <div className="flex min-w-0 flex-col">
            {totalLabel && <span className="text-xs text-text-muted">{totalLabel}</span>}
            <span className="truncate text-lg font-bold text-text-primary">{total}</span>
          </div>
        )}
        <div className={total ? "ml-auto shrink-0" : "flex-1"}>{children}</div>
      </div>
    </>
  );
}
