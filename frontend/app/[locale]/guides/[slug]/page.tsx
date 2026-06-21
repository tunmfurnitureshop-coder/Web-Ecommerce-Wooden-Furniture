import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { api } from "@/lib/api";
import { Container } from "@/design-system/primitives/container";
import { Breadcrumb } from "@/design-system/layout/breadcrumb";
import { ArticleMeta } from "@/design-system/content/article-meta";
import { MarkdownRenderer } from "@/design-system/content/markdown-renderer";
import { RelatedGuideCard } from "@/design-system/content/related-guide-card";
import { RecentlyViewedSection } from "@/design-system/commerce/recently-viewed-section";
import { ProductGrid } from "@/design-system/commerce/product-grid";
import { JsonLd } from "@/design-system/seo/json-ld";
import Image from "next/image";
import { formatCurrency } from "@/lib/format-currency";
import type { Metadata } from "next";

interface GuideDetail {
  id: string; type: string; title: string; slug: string;
  excerpt?: string | null; body_markdown: string;
  cover_image_url?: string | null; author_name?: string | null; published_at?: string | null;
  linked_products: Array<{ id: string; name: string; slug: string; base_price_vnd: number; primary_image_url?: string | null }>;
  linked_categories: Array<{ code: string; name: string; slug: string }>;
  related_guides: Array<{ id: string; type: string; title: string; slug: string; cover_image_url?: string | null; excerpt?: string | null }>;
  seo: { meta_title?: string | null; meta_description?: string | null; og_title?: string | null; og_description?: string | null; og_image_url?: string | null; canonical_url?: string | null };
  breadcrumbs: Array<{ name: string; href: string }>;
}

async function getGuide(slug: string, locale: string): Promise<GuideDetail | null> {
  try {
    return await api.get<GuideDetail>(`/api/v1/guides/${slug}?locale=${locale}`);
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { locale, slug } = await params;
  const g = await getGuide(slug, locale);
  if (!g) return {};
  return {
    title: g.seo.meta_title ?? g.title,
    description: g.seo.meta_description ?? g.excerpt ?? undefined,
    openGraph: {
      title: g.seo.og_title ?? g.title,
      description: g.seo.og_description ?? g.excerpt ?? undefined,
      images: g.seo.og_image_url ? [g.seo.og_image_url] : undefined,
    },
    alternates: { canonical: g.seo.canonical_url ?? undefined },
  };
}

export default async function GuideDetailPage({
  params,
}: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  const t = await getTranslations("discovery");
  const guide = await getGuide(slug, locale);
  if (!guide) notFound();

  const breadcrumbs = guide.breadcrumbs.map((b) => ({ label: b.name, href: b.href }));
  const linkedProducts = guide.linked_products.map((p) => ({
    id: p.id, slug: p.slug, title: p.name,
    primaryImageUrl: p.primary_image_url ?? "/images/placeholder-product.jpg",
    imageAlt: p.name, priceFormatted: formatCurrency(p.base_price_vnd),
    isAvailable: true, isWishlisted: false,
  }));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": guide.title,
    "description": guide.excerpt,
    "image": guide.seo.og_image_url ?? guide.cover_image_url,
    "author": { "@type": "Organization", "name": guide.author_name ?? "Vin Furniture" },
    "datePublished": guide.published_at,
    "mainEntityOfPage": guide.seo.canonical_url ? { "@type": "WebPage", "@id": guide.seo.canonical_url } : undefined,
  };

  return (
    <div className="bg-background min-h-screen">
      <JsonLd data={jsonLd} />
      {guide.cover_image_url && (
        <div className="relative aspect-[21/9] bg-surface-muted overflow-hidden">
          <Image src={guide.cover_image_url} alt={guide.title} fill className="object-cover" priority />
          <div className="absolute inset-0 bg-black/20" />
        </div>
      )}
      <Container className="py-8">
        <div className="flex flex-col gap-8 max-w-4xl mx-auto">
          <Breadcrumb items={breadcrumbs} />
          <header>
            <h1 className="text-3xl font-bold text-text-primary">{guide.title}</h1>
            <div className="mt-3">
              <ArticleMeta
                authorName={guide.author_name}
                publishedAt={guide.published_at}
                publishedLabel={t("publishedOn")}
                locale={locale}
              />
            </div>
          </header>
          <MarkdownRenderer content={guide.body_markdown} />
          {linkedProducts.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-text-primary mb-4">{t("featuredProducts")}</h2>
              <ProductGrid products={linkedProducts} />
            </div>
          )}
          {guide.related_guides.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-text-primary mb-4">{t("relatedGuides")}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {guide.related_guides.map((g) => (
                  <RelatedGuideCard
                    key={g.id} id={g.id} type={g.type} title={g.title} slug={g.slug}
                    excerpt={g.excerpt} coverImageUrl={g.cover_image_url}
                    readLabel={t("readGuide")} locale={locale}
                  />
                ))}
              </div>
            </div>
          )}
          <RecentlyViewedSection title={t("recentlyViewed")} locale={locale} />
        </div>
      </Container>
    </div>
  );
}
