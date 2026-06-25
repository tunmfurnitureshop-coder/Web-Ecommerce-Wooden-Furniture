import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { api } from "@/lib/api";
import type { ProductDetail } from "@/features/product/product.types";
import { ProductDetailClient } from "@/components/product/ProductDetailClient";
import { Container } from "@/design-system/primitives/container";
import { ProductRail } from "@/design-system/commerce/product-rail";
import { mapRelatedToCard } from "@/design-system/commerce/map-related-to-card";
import { RecentlyViewedSection } from "@/design-system/commerce/recently-viewed-section";
import { ProductTagList } from "@/design-system/commerce/product-tag-list";
import { JsonLd } from "@/design-system/seo/json-ld";
import type { Metadata } from "next";

interface RelatedProductRaw {
  id: string; name: string; slug: string;
  base_price_vnd: number; primary_image_url?: string | null;
}

async function getProduct(slug: string, locale: string) {
  try {
    return await api.get<ProductDetail>(`/api/v1/products/${slug}?locale=${locale}`);
  } catch {
    return null;
  }
}

async function getRelatedProducts(slug: string, locale: string) {
  try {
    const data = await api.get<{ items: RelatedProductRaw[] }>(`/api/v1/products/${slug}/related?locale=${locale}&limit=8`);
    return (data.items ?? []).map((p) => ({
      id: p.id, name: p.name, slug: p.slug,
      basePriceVnd: p.base_price_vnd, primaryImageUrl: p.primary_image_url,
    }));
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const product = await getProduct(slug, locale);
  if (!product) return {};
  return {
    title: product.seo?.meta_title ?? product.name,
    description: product.seo?.meta_description ?? undefined,
    openGraph: {
      title: product.seo?.og_title ?? product.name,
      description: product.seo?.og_description ?? undefined,
      images: product.seo?.og_image_url
        ? [product.seo.og_image_url]
        : product.primaryImageUrl
        ? [product.primaryImageUrl]
        : undefined,
    },
    alternates: { canonical: product.seo?.canonical_url ?? undefined },
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const t = await getTranslations("discovery");
  const [product, relatedItems] = await Promise.all([
    getProduct(slug, locale),
    getRelatedProducts(slug, locale),
  ]);
  if (!product) notFound();

  return (
    <Container className="py-8 pb-16">
      <div className="flex flex-col gap-12">
        {product.jsonLd && <JsonLd data={product.jsonLd} />}
        <ProductDetailClient product={product} locale={locale} />
        {product.tags && product.tags.length > 0 && (
          <ProductTagList tags={product.tags} locale={locale} />
        )}
        {relatedItems.length > 0 && (
          <ProductRail
            title={t("relatedProducts")}
            products={relatedItems.map(mapRelatedToCard)}
          />
        )}
        <RecentlyViewedSection title={t("recentlyViewed")} locale={locale} />
      </div>
    </Container>
  );
}
