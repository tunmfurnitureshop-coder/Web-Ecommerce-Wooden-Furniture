"use client";

import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useRouter, usePathname } from "@/lib/i18n";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const SORT_OPTIONS = [
  { value: "newest", key: "newest" },
  { value: "price_asc", key: "priceAsc" },
  { value: "price_desc", key: "priceDesc" },
  { value: "rating_desc", key: "ratingDesc" },
  { value: "relevance", key: "relevance" },
] as const;

interface SortSelectorProps {
  currentSort?: string;
}

export function SortSelector({ currentSort = "newest" }: SortSelectorProps) {
  const t = useTranslations("search.sort");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function handleSort(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", value);
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex items-center gap-2 shrink-0">
      <span className="text-sm text-muted-foreground whitespace-nowrap">{t("label")}:</span>
      <Select value={currentSort} onValueChange={handleSort}>
        <SelectTrigger className="w-44 h-8 text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {SORT_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {t(opt.key)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
