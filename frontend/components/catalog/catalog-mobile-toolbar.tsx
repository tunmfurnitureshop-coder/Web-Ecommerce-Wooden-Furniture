"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { SlidersHorizontal } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Sheet } from "@/design-system/overlay/sheet";
import { Button } from "@/design-system/components/button";
import { VisuallyHidden } from "@/design-system/primitives/visually-hidden";
import { CatalogFilters } from "./CatalogFilters";
import { CatalogSortSelector } from "./CatalogSortSelector";

interface CatalogFilterState {
  q?: string;
  sort?: string;
  room?: string;
  woodType?: string;
  minPrice?: string;
  maxPrice?: string;
}

interface CatalogMobileToolbarProps {
  currentFilters: CatalogFilterState;
  total: number;
}

/**
 * Sticky mobile (`<lg`) filter + sort bar. The desktop sidebar stays as-is; this
 * reuses the same <CatalogFilters> inside a bottom Sheet so filtering logic is
 * not duplicated. Sort reuses the native-select <CatalogSortSelector>.
 */
export function CatalogMobileToolbar({ currentFilters, total }: CatalogMobileToolbarProps) {
  const t = useTranslations("filters");
  const [open, setOpen] = useState(false);

  const activeCount = [
    currentFilters.room,
    currentFilters.woodType,
    currentFilters.minPrice || currentFilters.maxPrice,
  ].filter(Boolean).length;

  return (
    <div className="sticky top-header-mobile z-30 flex items-center justify-between gap-3 border-b border-border-default bg-background/95 py-2 backdrop-blur lg:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="inline-flex h-11 items-center gap-2 rounded-md border border-border-default bg-surface px-3 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus"
      >
        <SlidersHorizontal className="h-4 w-4" aria-hidden />
        {t("button")}
        {activeCount > 0 && (
          <>
            <span
              aria-hidden
              className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1 text-[11px] font-bold text-text-inverse"
            >
              {activeCount}
            </span>
            <VisuallyHidden>{t("activeCount", { count: activeCount })}</VisuallyHidden>
          </>
        )}
      </button>

      <CatalogSortSelector id="catalog-sort-mobile" currentSort={currentFilters.sort ?? "newest"} />

      <Sheet
        open={open}
        onOpenChange={setOpen}
        title={t("title")}
        closeLabel={t("close")}
        footer={
          <div className="flex items-center gap-3">
            <Link
              href="/products"
              onClick={() => setOpen(false)}
              className="inline-flex h-11 flex-1 items-center justify-center rounded-md border border-border-default text-sm font-medium text-text-secondary transition-colors hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus"
            >
              {t("reset")}
            </Link>
            <Button onClick={() => setOpen(false)} fullWidth className="h-11">
              {t("viewResults", { count: total })}
            </Button>
          </div>
        }
      >
        <CatalogFilters currentFilters={currentFilters} hideReset />
      </Sheet>
    </div>
  );
}
