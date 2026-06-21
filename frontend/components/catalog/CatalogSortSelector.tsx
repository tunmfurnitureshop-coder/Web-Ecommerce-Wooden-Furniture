"use client";

import { useTranslations } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";

const SORT_OPTIONS = [
  { value: "newest", labelKey: "newest" },
  { value: "price_asc", labelKey: "priceAsc" },
  { value: "price_desc", labelKey: "priceDesc" },
  { value: "rating_desc", labelKey: "ratingDesc" },
] as const;

interface CatalogSortSelectorProps {
  currentSort: string;
}

export function CatalogSortSelector({ currentSort }: CatalogSortSelectorProps) {
  const t = useTranslations("search.sort");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", e.target.value);
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="catalog-sort" className="text-sm text-text-muted whitespace-nowrap">
        {t("label")}:
      </label>
      <select
        id="catalog-sort"
        value={currentSort}
        onChange={handleChange}
        className="rounded-md border border-border-default bg-surface px-2 py-1.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-border-focus"
      >
        {SORT_OPTIONS.map(({ value, labelKey }) => (
          <option key={value} value={value}>
            {t(labelKey)}
          </option>
        ))}
      </select>
    </div>
  );
}
