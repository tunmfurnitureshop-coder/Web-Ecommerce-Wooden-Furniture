import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { api } from "@/lib/api";
import { Container } from "@/design-system/primitives/container";
import { Breadcrumb } from "@/design-system/layout/breadcrumb";
import { ProductGrid } from "@/design-system/commerce/product-grid";
import { RecentlyViewedSection } from "@/design-system/commerce/recently-viewed-section";
import { JsonLd } from "@/design-system/seo/json-ld";
import { formatCurrency } from "@/lib/format-currency";
import Image from "next/image";
import type { Metadata } from "next";

interface CollectionDetail {
  id: string;
  code: string;
  name: string;
  slug: string;
  short_description?: string | null;
  description?: string | null;
  cover_image_url?: string | null;
  published_at?: string | null;
  products: Array<{
    id: string; name: string; slug: string;
    base_price_vnd: number; primary_image_url?: string | null;
  }>;
  seo?: {
    meta_title?: string | null; meta_description?: string | null;
    og_title?: string | null; og_description?: string | null;
    og_image_url?: string | null; canonical_url?: string | null;
  };
  breadcrumbs: Array<{ name: string; href: string }>;
}

async function getCollection(slug: string, locale: string): Promise<CollectionDetail | null> {
  try {
    return await api.get<CollectionDetail>(`/api/v1/collections/${slug}?locale=${locale}`);
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const col = await getCollection(slug, locale);
  if (!col) return {};
  return {
    title: col.seo?.meta_title ?? col.name,
    description: col.seo?.meta_description ?? col.short_description ?? undefined,
    openGraph: {
      title: col.seo?.og_title ?? col.name,
      description: col.seo?.og_description ?? col.short_description ?? undefined,
      images: col.seo?.og_image_url ? [col.seo.og_image_url] : undefined,
    },
  };
}

export default async function CollectionDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const t = await getTranslations("discovery");
  const col = await getCollection(slug, locale);
  if (!col) notFound();

  const breadcrumbs = col.breadcrumbs.map((b) => ({ label: b.name, href: b.href }));

  const products = col.products.map((p) => ({
    id: p.id, slug: p.slug, title: p.name,
    primaryImageUrl: p.primary_image_url ?? "/images/placeholder-product.jpg",
    imageAlt: p.name,
    priceFormatted: formatCurrency(p.base_price_vnd),
    isAvailable: true, isWishlisted: false,
  }));

  return (
    <div className="bg-background min-h-screen">
      {col.seo && (
        <JsonLd data={{ "@context": "https://schema.org", "@type": "CollectionPage", "name": col.name, "description": col.description }} />
      )}
      <div className="relative aspect-[4/1] bg-surface-muted overflow-hidden">
        {col.cover_image_url && (
          <Image src={col.cover_image_url} alt={col.name} fill className="object-cover" priority />
        )}
        <div className="absolute inset-0 bg-black/30" />
        <div className="absolute inset-0 flex items-end">
          <Container className="pb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-white">{col.name}</h1>
            {col.short_description && (
              <p className="mt-2 text-white/80 max-w-2xl">{col.short_description}</p>
            )}
          </Container>
        </div>
      </div>
      <Container className="py-8">
        <div className="flex flex-col gap-8">
          <Breadcrumb items={breadcrumbs} />
          {products.length > 0 && <ProductGrid products={products} />}
          <RecentlyViewedSection title={t("recentlyViewed")} locale={locale} />
        </div>
      </Container>
    </div>
  );
}
