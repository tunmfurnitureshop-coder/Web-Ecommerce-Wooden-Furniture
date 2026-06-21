import { getTranslations } from "next-intl/server";
import { api } from "@/lib/api";
import { Container } from "@/design-system/primitives/container";
import { ProductGrid } from "@/design-system/commerce/product-grid";
import { ProductGridSkeleton } from "@/design-system/components/skeleton";
import { EmptyState } from "@/design-system/components/empty-state";
import { Breadcrumb } from "@/design-system/layout/breadcrumb";
import { Pagination } from "@/design-system/layout/pagination";
import { CatalogFilters } from "@/components/catalog/CatalogFilters";
import { CatalogSortSelector } from "@/components/catalog/CatalogSortSelector";
import { ActiveFilterChips } from "@/components/catalog/ActiveFilterChips";
import { Link } from "@/i18n/navigation";
import { Button } from "@/design-system/components/button";
import { Search } from "lucide-react";
import type { ProductListResponse } from "@/features/product/product.types";
import { formatCurrency } from "@/lib/format-currency";

const PAGE_SIZE = 24;

interface SearchParams {
  q?: string;
  sort?: string;
  room?: string;
  woodType?: string;
  minPrice?: string;
  maxPrice?: string;
  page?: string;
}

async function getProducts(locale: string, sp: SearchParams) {
  const query = new URLSearchParams({ locale, pageSize: String(PAGE_SIZE) });
  if (sp.q) query.set("q", sp.q);
  if (sp.sort) query.set("sort", sp.sort);
  if (sp.room) query.set("room", sp.room);
  if (sp.woodType) query.set("woodType", sp.woodType);
  if (sp.minPrice) query.set("minPrice", sp.minPrice);
  if (sp.maxPrice) query.set("maxPrice", sp.maxPrice);
  if (sp.page) query.set("page", sp.page);
  try {
    return await api.get<ProductListResponse>(`/api/v1/products?${query}`);
  } catch {
    return { items: [], page: 1, pageSize: PAGE_SIZE, total: 0 };
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
  const tNav = await getTranslations("nav");
  const result = await getProducts(locale, sp);
  const currentPage = Number(sp.page ?? 1);
  const totalPages = Math.ceil(result.total / PAGE_SIZE);

  const products = result.items.map((p) => ({
    id: p.id,
    slug: p.slug,
    title: p.name,
    subtitle: undefined,
    primaryImageUrl: p.primaryImageUrl ?? "/images/placeholder-product.jpg",
    imageAlt: p.name,
    priceFormatted: formatCurrency(p.basePriceVnd ?? 0),
    rating: undefined,
    reviewCount: undefined,
    isAvailable: true,
    isWishlisted: false,
  }));

  const breadcrumbs = [
    { label: tNav("home"), href: "/" },
    { label: sp.q ? `"${sp.q}"` : t("allProducts") },
  ];

  return (
    <div className="bg-background min-h-screen">
      <Container className="py-8">
        <div className="flex flex-col gap-6">
          <Breadcrumb items={breadcrumbs} />

          <div className="flex items-start gap-8">
            {/* Sidebar */}
            <aside className="hidden lg:flex w-60 xl:w-64 shrink-0 flex-col gap-6 sticky top-[calc(var(--header-height-desktop)+1.5rem)]">
              <CatalogFilters currentFilters={sp} />
            </aside>

            {/* Main */}
            <div className="flex-1 min-w-0 flex flex-col gap-5">
              {/* Heading + Sort */}
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h1 className="text-2xl font-bold text-text-primary">
                    {sp.q ? `${t("resultsFor")} "${sp.q}"` : t("allProducts")}
                  </h1>
                  <p className="text-sm text-text-muted mt-0.5">
                    {result.total} {t("sort.label")}
                  </p>
                </div>
                <CatalogSortSelector currentSort={sp.sort ?? "newest"} />
              </div>

              {/* Active filters */}
              <ActiveFilterChips filters={sp} />

              {/* Grid */}
              {products.length === 0 ? (
                <EmptyState
                  icon={<Search className="h-12 w-12" />}
                  title={t("noResults")}
                  description={t("noResultsHint")}
                  action={
                    <Link href="/products">
                      <Button variant="outline">{t("clearFilters")}</Button>
                    </Link>
                  }
                />
              ) : (
                <ProductGrid products={products} />
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center pt-4">
                  <PaginationServer page={currentPage} totalPages={totalPages} filters={sp} />
                </div>
              )}
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}

function PaginationServer({ page, totalPages, filters }: { page: number; totalPages: number; filters: SearchParams }) {
  const pages = Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
    if (totalPages <= 7) return i + 1;
    if (page <= 4) return i + 1;
    if (page >= totalPages - 3) return totalPages - 6 + i;
    return page - 3 + i;
  });

  const buildHref = (p: number) => {
    const q = new URLSearchParams(filters as Record<string, string>);
    q.set("page", String(p));
    return `/products?${q.toString()}`;
  };

  return (
    <nav aria-label="Pagination" className="flex items-center gap-1">
      {page > 1 && (
        <Link href={buildHref(page - 1)} className="inline-flex h-9 min-w-[2.25rem] items-center justify-center rounded-md border border-border-default px-2 text-sm text-text-secondary hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus">
          ‹
        </Link>
      )}
      {pages.map((p) => (
        <Link
          key={p}
          href={buildHref(p)}
          aria-current={p === page ? "page" : undefined}
          className={`inline-flex h-9 min-w-[2.25rem] items-center justify-center rounded-md border px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus ${
            p === page
              ? "border-brand bg-brand text-text-inverse"
              : "border-border-default text-text-secondary hover:bg-surface-muted"
          }`}
        >
          {p}
        </Link>
      ))}
      {page < totalPages && (
        <Link href={buildHref(page + 1)} className="inline-flex h-9 min-w-[2.25rem] items-center justify-center rounded-md border border-border-default px-2 text-sm text-text-secondary hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus">
          ›
        </Link>
      )}
    </nav>
  );
}
