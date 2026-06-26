import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { api } from "@/lib/api";
import { Container } from "@/design-system/primitives/container";
import { Breadcrumb } from "@/design-system/layout/breadcrumb";
import { ProductGrid } from "@/design-system/commerce/product-grid";
import { RelatedGuideCard } from "@/design-system/content/related-guide-card";
import { JsonLd } from "@/design-system/seo/json-ld";
import { formatCurrency } from "@/lib/format-currency";
import type { Metadata } from "next";

interface MaterialLanding {
  code: string; name: string; slug: string; description?: string | null;
  seo: { meta_title?: string | null; meta_description?: string | null; og_title?: string | null; og_description?: string | null };
  breadcrumbs: Array<{ name: string; href: string }>;
  products: Array<{ id: string; name: string; slug: string; basePriceVnd: number; primaryImageUrl?: string | null }>;
  related_guides: Array<{ id: string; type: string; title: string; slug: string; cover_image_url?: string | null; excerpt?: string | null }>;
}

async function getMaterialLanding(slug: string, locale: string): Promise<MaterialLanding | null> {
  try {
    return await api.get<MaterialLanding>(`/api/v1/materials/${slug}?locale=${locale}`);
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { locale, slug } = await params;
  const mat = await getMaterialLanding(slug, locale);
  if (!mat) return {};
  return {
    title: mat.seo.meta_title ?? mat.name,
    description: mat.seo.meta_description ?? mat.description ?? undefined,
  };
}

export default async function MaterialLandingPage({
  params,
}: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  const t = await getTranslations("discovery");
  const mat = await getMaterialLanding(slug, locale);
  if (!mat) notFound();

  const breadcrumbs = mat.breadcrumbs.map((b) => ({ label: b.name, href: b.href }));
  const products = mat.products.map((p) => ({
    id: p.id, slug: p.slug, title: p.name,
    primaryImageUrl: p.primaryImageUrl ?? "/images/placeholder-product.jpg",
    imageAlt: p.name, priceFormatted: formatCurrency(p.basePriceVnd),
    isAvailable: true, isWishlisted: false,
  }));

  return (
    <div className="bg-background min-h-screen">
      <JsonLd data={{ "@context": "https://schema.org", "@type": "WebPage", "name": mat.name }} />
      <Container className="py-8">
        <div className="flex flex-col gap-8">
          <Breadcrumb items={breadcrumbs} />
          <div>
            <h1 className="text-3xl font-bold text-text-primary">{mat.name}</h1>
            {mat.description && <p className="mt-2 text-text-secondary max-w-2xl">{mat.description}</p>}
          </div>
          {products.length > 0 && <ProductGrid products={products} />}
          {mat.related_guides.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-text-primary mb-4">{t("relatedGuides")}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {mat.related_guides.map((g) => (
                  <RelatedGuideCard
                    key={g.id}
                    id={g.id} type={g.type} title={g.title} slug={g.slug}
                    excerpt={g.excerpt} coverImageUrl={g.cover_image_url}
                    readLabel={t("readGuide")} locale={locale}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </Container>
    </div>
  );
}
