import { getTranslations } from "next-intl/server";
import { api } from "@/lib/api";
import { Container } from "@/design-system/primitives/container";
import { Breadcrumb } from "@/design-system/layout/breadcrumb";
import { ArticleHero } from "@/design-system/content/article-hero";
import { ArticleGrid } from "@/design-system/content/article-grid";
import { EmptyState } from "@/design-system/components/empty-state";
import { BookOpen } from "lucide-react";
import type { Metadata } from "next";

interface Guide {
  id: string; type: string; title: string; slug: string;
  excerpt?: string | null; cover_image_url?: string | null;
  author_name?: string | null; published_at?: string | null;
}

interface GuidesResponse {
  items: Guide[];
  total: number;
  page: number;
  page_size: number;
}

async function getGuides(locale: string, type?: string): Promise<GuidesResponse> {
  try {
    const q = new URLSearchParams({ locale, pageSize: "12" });
    if (type) q.set("type", type);
    return await api.get<GuidesResponse>(`/api/v1/guides?${q}`);
  } catch {
    return { items: [], total: 0, page: 1, page_size: 12 };
  }
}

export async function generateMetadata({
  params,
}: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "discovery" });
  return { title: t("guides") };
}

export default async function GuidesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ type?: string }>;
}) {
  const { locale } = await params;
  const { type } = await searchParams;
  const t = await getTranslations("discovery");
  const tNav = await getTranslations("nav");
  const { items } = await getGuides(locale, type);

  const breadcrumbs = [
    { label: tNav("home"), href: "/" },
    { label: t("guides") },
  ];

  const [hero, ...rest] = items;

  return (
    <div className="bg-background min-h-screen">
      <Container className="py-8">
        <div className="flex flex-col gap-8">
          <Breadcrumb items={breadcrumbs} />
          <h1 className="text-3xl font-bold text-text-primary">{t("guides")}</h1>
          {items.length === 0 ? (
            <EmptyState
              icon={<BookOpen className="h-12 w-12" />}
              title={t("noResults")}
            />
          ) : (
            <>
              {hero && (
                <ArticleHero
                  type={hero.type} title={hero.title} slug={hero.slug}
                  excerpt={hero.excerpt} coverImageUrl={hero.cover_image_url}
                  authorName={hero.author_name} publishedAt={hero.published_at}
                  readLabel={t("readGuide")} locale={locale}
                />
              )}
              {rest.length > 0 && <ArticleGrid articles={rest} locale={locale} />}
            </>
          )}
        </div>
      </Container>
    </div>
  );
}
