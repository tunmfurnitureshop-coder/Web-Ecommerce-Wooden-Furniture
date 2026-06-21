import { getTranslations } from "next-intl/server";
import { api } from "@/lib/api";
import { Container } from "@/design-system/primitives/container";
import { Breadcrumb } from "@/design-system/layout/breadcrumb";
import { CollectionGrid } from "@/design-system/commerce/collection-grid";
import { EmptyState } from "@/design-system/components/empty-state";
import { Layers } from "lucide-react";
import type { Metadata } from "next";

interface Collection {
  id: string;
  code: string;
  name: string;
  slug: string;
  short_description?: string | null;
  cover_image_url?: string | null;
  published_at?: string | null;
}

interface CollectionListResponse {
  items: Collection[];
}

async function getCollections(locale: string): Promise<CollectionListResponse> {
  try {
    return await api.get<CollectionListResponse>(`/api/v1/collections?locale=${locale}`);
  } catch {
    return { items: [] };
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "discovery" });
  return { title: t("collections") };
}

export default async function CollectionsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("discovery");
  const tNav = await getTranslations("nav");
  const { items } = await getCollections(locale);

  const breadcrumbs = [
    { label: tNav("home"), href: "/" },
    { label: t("collections") },
  ];

  const collections = items.map((c) => ({
    id: c.id,
    code: c.code,
    slug: c.slug,
    name: c.name,
    shortDescription: c.short_description,
    coverImageUrl: c.cover_image_url,
  }));

  return (
    <div className="bg-background min-h-screen">
      <Container className="py-8">
        <div className="flex flex-col gap-6">
          <Breadcrumb items={breadcrumbs} />
          <h1 className="text-3xl font-bold text-text-primary">{t("collections")}</h1>
          {collections.length === 0 ? (
            <EmptyState
              icon={<Layers className="h-12 w-12" />}
              title={t("noResults")}
            />
          ) : (
            <CollectionGrid collections={collections} locale={locale} />
          )}
        </div>
      </Container>
    </div>
  );
}
