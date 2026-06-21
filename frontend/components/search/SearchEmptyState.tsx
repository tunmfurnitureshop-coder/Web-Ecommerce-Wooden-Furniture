"use client";

import { useTranslations } from "next-intl";
import { SearchX } from "lucide-react";
import { Link } from "@/lib/i18n";
import { Button } from "@/components/ui/button";

interface SearchEmptyStateProps {
  query?: string;
}

export function SearchEmptyState({ query }: SearchEmptyStateProps) {
  const t = useTranslations("search");

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
      <SearchX className="h-12 w-12 text-muted-foreground/30" />
      <p className="font-medium">
        {query
          ? `${t("noResultsFor")} "${query}"`
          : t("noResults")}
      </p>
      <p className="text-sm text-muted-foreground">{t("noResultsHint")}</p>
      <Link href="/products">
        <Button variant="outline" size="sm">{t("clearFilters")}</Button>
      </Link>
    </div>
  );
}
