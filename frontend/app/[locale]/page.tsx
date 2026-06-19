import { getTranslations } from "next-intl/server";
import { Link } from "@/lib/i18n";
import { ProductGrid } from "@/components/product/ProductGrid";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import type { ProductListResponse } from "@/features/product/product.types";

async function getFeaturedProducts(locale: string) {
  try {
    return await api.get<ProductListResponse>(
      `/api/v1/products?locale=${locale}&pageSize=6`
    );
  } catch {
    return { items: [], page: 1, pageSize: 6, total: 0 };
  }
}

const ROOM_CATEGORIES = [
  "living_room",
  "bedroom",
  "dining_room",
  "office",
  "outdoor",
] as const;

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("home");
  const tFilters = await getTranslations("filters");
  const featured = await getFeaturedProducts(locale);

  return (
    <div>
      {/* Hero */}
      <section className="bg-secondary py-24 px-6 text-center">
        <h1 className="text-4xl font-bold tracking-tight mb-4">{t("heroTitle")}</h1>
        <p className="text-muted-foreground text-lg mb-8">{t("heroSubtitle")}</p>
        <Link href="/products">
          <Button size="lg">{t("heroCtaShop")}</Button>
        </Link>
      </section>

      {/* Featured Products */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-bold mb-8">{t("featuredTitle")}</h2>
        <ProductGrid products={featured.items} />
        <div className="text-center mt-8">
          <Link href="/products">
            <Button variant="outline">{tFilters("all")}</Button>
          </Link>
        </div>
      </section>

      {/* Categories */}
      <section className="bg-secondary py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold mb-8">{t("categoriesTitle")}</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {ROOM_CATEGORIES.map((code) => (
              <Link key={code} href={`/products?room=${code}`}>
                <div className="bg-background rounded-lg p-6 text-center hover:shadow-md transition-shadow cursor-pointer">
                  <p className="font-medium text-sm">{t(`categories.${code}`)}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
