import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { api } from "@/lib/api";
import { Section } from "@/design-system/primitives/section";
import { Container } from "@/design-system/primitives/container";
import { ProductGrid } from "@/design-system/commerce/product-grid";
import { ProductGridSkeleton } from "@/design-system/components/skeleton";
import { HomeHeroSlideshow } from "@/components/home/home-hero-slideshow";
import { HomeHeroStatic } from "@/components/home/home-hero-static";
import { HomeUspStrip } from "@/components/home/home-usp-strip";
import { HomeRoomCards } from "@/components/home/home-room-cards";
import { HomeDealsSection } from "@/components/home/home-deals-section";
import { HomeBestSellersSection } from "@/components/home/home-best-sellers-section";
import {
  HomeCollectionsSection,
  type HomeCollectionItem,
} from "@/components/home/home-collections-section";
import { HomeBrandStory } from "@/components/home/home-brand-story";
import { HomeTrustSection } from "@/components/home/home-trust-section";
import { listActiveCampaigns } from "@/features/campaign/campaign.api";
import { mapCampaignToHeroSlide, type HeroSlideViewModel } from "@/features/campaign/campaign.mappers";
import type { ProductListResponse, ProductDealItem, BestSellerItem } from "@/features/product/product.types";
import { getDeals, getBestSellers } from "@/features/product/product.api";
import { ArrowRight } from "lucide-react";
import type { ProductCardViewModel } from "@/design-system/commerce/product-card";
import { formatCurrency } from "@/lib/format-currency";

// Always render fresh so newly activated campaigns / deals appear immediately
// (otherwise Next caches the fetches and the homepage freezes on first render).
export const dynamic = "force-dynamic";

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

async function getHeroSlides(locale: string): Promise<HeroSlideViewModel[]> {
  try {
    const res = await listActiveCampaigns(locale, "HOME_HERO");
    return res.items.map(mapCampaignToHeroSlide);
  } catch {
    return [];
  }
}

async function getDealsData(locale: string): Promise<ProductDealItem[]> {
  try {
    return (await getDeals(locale)).items;
  } catch {
    return [];
  }
}

async function getBestSellersData(locale: string): Promise<BestSellerItem[]> {
  try {
    return (await getBestSellers(locale)).items;
  } catch {
    return [];
  }
}

interface CollectionApiItem {
  id: string;
  name: string;
  slug: string;
  short_description?: string | null;
  cover_image_url?: string | null;
}

async function getCollectionsData(locale: string): Promise<HomeCollectionItem[]> {
  try {
    const res = await api.get<{ items: CollectionApiItem[] }>(
      `/api/v1/collections?locale=${locale}`
    );
    return res.items.map((c) => ({
      id: c.id,
      slug: c.slug,
      name: c.name,
      shortDescription: c.short_description,
      coverImageUrl: c.cover_image_url,
    }));
  } catch {
    return [];
  }
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("home");
  const [products, heroSlides, deals, bestSellers, collections] = await Promise.all([
    getFeaturedProducts(locale),
    getHeroSlides(locale),
    getDealsData(locale),
    getBestSellersData(locale),
    getCollectionsData(locale),
  ]);

  return (
    <div>
      {/* Single page-level h1 keeps heading order valid across both hero variants */}
      <h1 className="sr-only">{t("heroTitle")}</h1>

      {/* Hero — campaign slideshow with static fallback */}
      {heroSlides.length > 0 ? (
        <HomeHeroSlideshow slides={heroSlides} />
      ) : (
        <HomeHeroStatic />
      )}

      {/* Service promises — reassurance above the fold */}
      <HomeUspStrip />

      {/* Browse by Room */}
      <HomeRoomCards />

      {/* Deals & curated collections & best-sellers (each hides itself when empty) */}
      <HomeDealsSection deals={deals} />
      <HomeCollectionsSection collections={collections} locale={locale} />
      <HomeBestSellersSection items={bestSellers} />

      {/* New arrivals */}
      <Section>
        <Container>
          <div className="flex flex-col gap-8">
            <div className="flex items-center justify-between gap-4">
              <h2 className="font-display text-3xl md:text-4xl font-normal text-text-primary">
                {t("featuredTitle")}
              </h2>
              <Link
                href="/products"
                className="flex shrink-0 items-center gap-1 rounded-sm text-sm font-medium text-brand transition-colors hover:text-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus"
              >
                {t("viewAll")} <ArrowRight className="h-4 w-4" aria-hidden />
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

      {/* Brand story */}
      <HomeBrandStory />

      {/* Trust / Benefits */}
      <HomeTrustSection />
    </div>
  );
}
