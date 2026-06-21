import { getTranslations } from "next-intl/server";
import { ProductGrid } from "@/components/product/ProductGrid";
import { ProductFilters } from "@/components/product/ProductFilters";
import { SortSelector } from "@/components/search/SortSelector";
import { SearchEmptyState } from "@/components/search/SearchEmptyState";
import { api } from "@/lib/api";
import type { ProductListResponse } from "@/features/product/product.types";

interface SearchParams {
  q?: string;
  sort?: string;
  room?: string;
  woodType?: string;
  minPrice?: string;
  maxPrice?: string;
  page?: string;
}

async function getProducts(locale: string, params: SearchParams) {
  const query = new URLSearchParams({ locale, pageSize: "12" });
  if (params.q) query.set("q", params.q);
  if (params.sort) query.set("sort", params.sort);
  if (params.room) query.set("room", params.room);
  if (params.woodType) query.set("woodType", params.woodType);
  if (params.minPrice) query.set("minPrice", params.minPrice);
  if (params.maxPrice) query.set("maxPrice", params.maxPrice);
  if (params.page) query.set("page", params.page);
  try {
    return await api.get<ProductListResponse>(`/api/v1/products?${query}`);
  } catch {
    return { items: [], page: 1, pageSize: 12, total: 0 };
  }
}

export default async function ProductsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  const t = await getTranslations("search");
  const tCommon = await getTranslations("common");
  const result = await getProducts(locale, sp);
  const currentPage = Number(sp.page ?? 1);
  const totalPages = Math.ceil(result.total / (result.pageSize || 12));

  const pageTitle = sp.q
    ? `${t("resultsFor")} "${sp.q}" (${result.total})`
    : t("allProducts");

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold mb-6">{pageTitle}</h1>
      <div className="flex flex-col md:flex-row gap-8">
        <aside className="w-full md:w-64 shrink-0">
          <ProductFilters currentFilters={sp} />
        </aside>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">
              {result.total} {tCommon("results")}
            </p>
            <SortSelector currentSort={sp.sort ?? "newest"} />
          </div>

          {result.items.length === 0 ? (
            <SearchEmptyState query={sp.q} />
          ) : (
            <>
              <ProductGrid products={result.items} />
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-4 mt-8 text-sm">
                  <span className="text-muted-foreground">
                    {tCommon("page")} {currentPage} {tCommon("of")} {totalPages}
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
