import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { api } from "@/lib/api";
import { Container } from "@/design-system/primitives/container";
import { Breadcrumb } from "@/design-system/layout/breadcrumb";
import { ProductGrid } from "@/design-system/commerce/product-grid";
import { CollectionGrid } from "@/design-system/commerce/collection-grid";
import { ProductTagList } from "@/design-system/commerce/product-tag-list";
import { RelatedGuideCard } from "@/design-system/content/related-guide-card";
import { RecentlyViewedSection } from "@/design-system/commerce/recently-viewed-section";
import { JsonLd } from "@/design-system/seo/json-ld";
import { formatCurrency } from "@/lib/format-currency";
import type { Metadata } from "next";

interface CategoryLanding {
  code: string; name: string; slug: string; description?: string | null;
  seo: { meta_title?: string | null; meta_description?: string | null; og_title?: string | null; og_description?: string | null; og_image_url?: string | null };
  breadcrumbs: Array<{ name: string; href: string }>;
  featured_products: Array<{ id: string; name: string; slug: string; basePriceVnd: number; primaryImageUrl?: string | null }>;
  available_tags: Array<{ code: string; type: string; name: string; slug: string }>;
  featured_collections: Array<{ id: string; name: string; slug: string; cover_image_url?: string | null }>;
}

async function getCategoryLanding(slug: string, locale: string): Promise<CategoryLanding | null> {
  try {
    return await api.get<CategoryLanding>(`/api/v1/categories/${slug}?locale=${locale}`);
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { locale, slug } = await params;
  const cat = await getCategoryLanding(slug, locale);
  if (!cat) return {};
  return {
    title: cat.seo.meta_title ?? cat.name,
    description: cat.seo.meta_description ?? cat.description ?? undefined,
    openGraph: {
      title: cat.seo.og_title ?? cat.name,
      description: cat.seo.og_description ?? cat.description ?? undefined,
      images: cat.seo.og_image_url ? [cat.seo.og_image_url] : undefined,
    },
  };
}

export default async function CategoryLandingPage({
  params,
}: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  const t = await getTranslations("discovery");
  const cat = await getCategoryLanding(slug, locale);
  if (!cat) notFound();

  const breadcrumbs = cat.breadcrumbs.map((b) => ({ label: b.name, href: b.href }));
  const products = cat.featured_products.map((p) => ({
    id: p.id, slug: p.slug, title: p.name,
    primaryImageUrl: p.primaryImageUrl ?? "/images/placeholder-product.jpg",
    imageAlt: p.name, priceFormatted: formatCurrency(p.basePriceVnd),
    isAvailable: true, isWishlisted: false,
  }));
  const collections = cat.featured_collections.map((c) => ({
    id: c.id, code: c.id, slug: c.slug, name: c.name, coverImageUrl: c.cover_image_url,
  }));

  return (
    <div className="bg-background min-h-screen">
      <JsonLd data={{ "@context": "https://schema.org", "@type": "WebPage", "name": cat.name }} />
      <Container className="py-8">
        <div className="flex flex-col gap-8">
          <Breadcrumb items={breadcrumbs} />
          <div>
            <h1 className="text-3xl font-bold text-text-primary">{cat.name}</h1>
            {cat.description && <p className="mt-2 text-text-secondary max-w-2xl">{cat.description}</p>}
          </div>
          {cat.available_tags.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-text-primary mb-3">{t("filterByTag")}</h2>
              <ProductTagList tags={cat.available_tags} locale={locale} linkType="material" />
            </div>
          )}
          {collections.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-text-primary mb-4">{t("collections")}</h2>
              <CollectionGrid collections={collections} locale={locale} />
            </div>
          )}
          {products.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-text-primary mb-4">{t("featuredProducts")}</h2>
              <ProductGrid products={products} />
            </div>
          )}
          <RecentlyViewedSection title={t("recentlyViewed")} locale={locale} />
        </div>
      </Container>
    </div>
  );
}
