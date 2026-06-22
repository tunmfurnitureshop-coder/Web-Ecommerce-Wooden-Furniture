import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { api } from "@/lib/api";
import { Container } from "@/design-system/primitives/container";
import { Breadcrumb } from "@/design-system/layout/breadcrumb";
import { JsonLd } from "@/design-system/seo/json-ld";
import { CampaignHero } from "@/design-system/commerce/CampaignHero";
import { CampaignProductSection } from "@/design-system/commerce/CampaignProductSection";
import { RecentlyViewedSection } from "@/design-system/commerce/recently-viewed-section";
import { formatCurrency } from "@/lib/format-currency";
import type { CampaignDetailResponse } from "@/features/campaign/campaign.types";
import type { Metadata } from "next";

async function getCampaign(slug: string, locale: string): Promise<CampaignDetailResponse | null> {
  try {
    return await api.get<CampaignDetailResponse>(`/api/v1/campaigns/${slug}?locale=${locale}`);
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
  const c = await getCampaign(slug, locale);
  if (!c) return {};
  const base = process.env.NEXT_PUBLIC_SITE_BASE_URL ?? "";
  return {
    title: c.metaTitle ?? c.name,
    description: c.metaDescription ?? c.shortDescription ?? undefined,
    openGraph: {
      title: c.ogTitle ?? c.name,
      description: c.ogDescription ?? c.shortDescription ?? undefined,
      images: c.ogImageUrl ? [{ url: c.ogImageUrl }] : undefined,
      url: `${base}/${locale}/campaigns/${slug}`,
    },
    alternates: { canonical: `${base}/${locale}/campaigns/${slug}` },
  };
}

export default async function CampaignPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const t = await getTranslations("campaign");
  const campaign = await getCampaign(slug, locale);
  if (!campaign) notFound();

  const breadcrumbs = [
    { label: t("home"), href: "/" },
    { label: t("campaigns"), href: "/campaigns" },
    { label: campaign.name, href: `/campaigns/${slug}` },
  ];

  const endsAtLabel = campaign.endsAt
    ? `${t("endsAt")} ${new Date(campaign.endsAt).toLocaleDateString(locale === "vi" ? "vi-VN" : "zh-CN")}`
    : undefined;

  const products = campaign.products.map((p) => ({
    id: p.id,
    slug: p.slug,
    title: p.name,
    primaryImageUrl: p.heroImageUrl ?? "/images/placeholder-product.jpg",
    imageAlt: p.name,
    priceFormatted: formatCurrency(p.basePriceVnd),
    isAvailable: true,
    isWishlisted: false,
  }));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: campaign.name,
    description: campaign.shortDescription ?? undefined,
    startDate: campaign.startsAt,
    endDate: campaign.endsAt ?? undefined,
    image: campaign.ogImageUrl ?? campaign.heroImageUrl ?? undefined,
  };

  return (
    <>
      <JsonLd data={jsonLd} />
      <Container className="py-8 pb-16 flex flex-col gap-10">
        <Breadcrumb items={breadcrumbs} />
        <CampaignHero
          name={campaign.name}
          shortDescription={campaign.shortDescription}
          heroImageUrl={campaign.heroImageUrl}
          endsAtLabel={endsAtLabel}
          className="min-h-[320px]"
        />

        {campaign.descriptionMarkdown && (
          <section className="prose prose-stone max-w-3xl">
            <p className="text-text-secondary">{campaign.descriptionMarkdown}</p>
          </section>
        )}

        {campaign.collections.length > 0 && (
          <section className="flex flex-col gap-4">
            <h2 className="text-xl font-semibold text-text-primary">{t("featuredCollections")}</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {campaign.collections.map((col) => (
                <a key={col.id} href={`/${locale}/collections/${col.slug}`} className="rounded-lg overflow-hidden border border-border-default bg-surface-muted hover:opacity-90 transition-opacity">
                  {col.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={col.imageUrl} alt={col.name} className="w-full aspect-video object-cover" />
                  )}
                  <div className="p-3 text-sm font-medium text-text-primary">{col.name}</div>
                </a>
              ))}
            </div>
          </section>
        )}

        <CampaignProductSection
          title={t("featuredProducts")}
          products={products}
          locale={locale}
        />

        <RecentlyViewedSection title={t("recentlyViewed")} locale={locale} />
      </Container>
    </>
  );
}
