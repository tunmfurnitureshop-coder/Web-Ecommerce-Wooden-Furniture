import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { api } from "@/lib/api";
import { Section } from "@/design-system/primitives/section";
import { Container } from "@/design-system/primitives/container";
import { ProductGrid } from "@/design-system/commerce/product-grid";
import { ProductGridSkeleton } from "@/design-system/components/skeleton";
import { Button } from "@/design-system/components/button";
import type { ProductListResponse } from "@/features/product/product.types";
import { ArrowRight, Truck, ShieldCheck, Clock, Headphones } from "lucide-react";
import type { ProductCardViewModel } from "@/design-system/commerce/product-card";
import { formatCurrency } from "@/lib/format-currency";

const ROOM_CATEGORIES = [
  { slug: "living_room", image: "/images/rooms/living.jpg" },
  { slug: "bedroom", image: "/images/rooms/bedroom.jpg" },
  { slug: "dining_room", image: "/images/rooms/dining.jpg" },
] as const;

async function getFeaturedProducts(locale: string): Promise<ProductCardViewModel[]> {
  try {
    const res = await api.get<ProductListResponse>(
      `/api/v1/products?locale=${locale}&pageSize=8&sort=newest`
    );
    return res.items.map((p) => ({
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
  } catch {
    return [];
  }
}

const TRUST_ICONS = [Truck, ShieldCheck, Clock, Headphones] as const;

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("home");
  const products = await getFeaturedProducts(locale);

  const trustItems = ["delivery", "quality", "warranty", "support"] as const;

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-stone-100 min-h-[520px] flex items-center">
        <div className="mx-auto max-w-container px-4 md:px-8 xl:px-12 py-20 md:py-28">
          <div className="max-w-xl flex flex-col gap-6">
            <h1 className="font-display text-5xl font-normal text-text-primary leading-tight">
              {t("heroTitle")}
            </h1>
            <p className="text-lg text-text-secondary">{t("heroSubtitle")}</p>
            <div className="flex items-center gap-4">
              <Link href="/products">
                <Button variant="primary" size="lg">
                  {t("heroCtaShop")}
                  <ArrowRight className="h-4 w-4 ml-1" aria-hidden />
                </Button>
              </Link>
              <Link href="/products?sort=rating_desc">
                <Button variant="outline" size="lg">{t("heroCtaCollection")}</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Browse by Room */}
      <Section className="bg-background">
        <Container>
          <div className="flex flex-col gap-8">
            <h2 className="text-3xl font-bold text-text-primary">{t("browseByRoom")}</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {ROOM_CATEGORIES.map(({ slug }) => (
                <Link
                  key={slug}
                  href={`/products?room=${slug}`}
                  className="group relative flex h-48 md:h-64 items-end overflow-hidden rounded-lg bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus"
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-900/60 to-transparent" aria-hidden />
                  <p className="relative z-10 p-5 text-base font-semibold text-white group-hover:underline">
                    {t(`categories.${slug}`)}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </Container>
      </Section>

      {/* Featured Products */}
      <Section>
        <Container>
          <div className="flex flex-col gap-8">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-bold text-text-primary">{t("featuredTitle")}</h2>
              <Link
                href="/products"
                className="flex items-center gap-1 text-sm font-medium text-brand hover:text-brand-hover transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus rounded-sm"
              >
                {t("heroCtaShop")} <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
            {products.length > 0 ? (
              <ProductGrid products={products} />
            ) : (
              <ProductGridSkeleton count={8} />
            )}
          </div>
        </Container>
      </Section>

      {/* Trust / Benefits */}
      <Section className="bg-stone-50">
        <Container>
          <h2 className="text-2xl font-bold text-text-primary text-center mb-10">{t("trustTitle")}</h2>
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {trustItems.map((key, i) => {
              const Icon = TRUST_ICONS[i];
              return (
                <div key={key} className="flex flex-col items-center gap-3 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-soft">
                    <Icon className="h-6 w-6 text-brand" aria-hidden />
                  </div>
                  <p className="font-semibold text-text-primary text-sm">{t(`trust.${key}.title`)}</p>
                  <p className="text-xs text-text-muted">{t(`trust.${key}.desc`)}</p>
                </div>
              );
            })}
          </div>
        </Container>
      </Section>
    </div>
  );
}
