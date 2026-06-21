import type { GuideCardViewModel, GuideDetailViewModel, SeoMetadataViewModel } from "../view-models/discovery.view-model";

interface GuideCardDTO {
  id: string;
  type: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  cover_image_url?: string | null;
  author_name?: string | null;
  published_at?: string | null;
}

interface GuideDetailDTO {
  id: string;
  type: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  body_markdown: string;
  cover_image_url?: string | null;
  author_name?: string | null;
  published_at?: string | null;
  linked_products: Array<{ id: string; name: string; slug: string; base_price_vnd: number; primary_image_url?: string | null }>;
  linked_categories: Array<{ code: string; name: string; slug: string }>;
  related_guides: GuideCardDTO[];
  seo: { meta_title?: string | null; meta_description?: string | null; og_title?: string | null; og_description?: string | null; og_image_url?: string | null; canonical_url?: string | null };
  breadcrumbs: Array<{ name: string; href: string }>;
}

export function mapGuideCardDTOtoViewModel(dto: GuideCardDTO): GuideCardViewModel {
  return {
    id: dto.id,
    type: dto.type,
    title: dto.title,
    slug: dto.slug,
    excerpt: dto.excerpt ?? null,
    coverImageUrl: dto.cover_image_url ?? null,
    authorName: dto.author_name ?? null,
    publishedAt: dto.published_at ?? null,
  };
}

export function mapGuideDetailDTOtoViewModel(dto: GuideDetailDTO): GuideDetailViewModel {
  const seo: SeoMetadataViewModel = {
    title: dto.seo.meta_title ?? dto.title,
    description: dto.seo.meta_description ?? null,
    ogTitle: dto.seo.og_title ?? dto.seo.meta_title ?? dto.title,
    ogDescription: dto.seo.og_description ?? dto.seo.meta_description ?? null,
    ogImageUrl: dto.seo.og_image_url ?? dto.cover_image_url ?? null,
    canonicalUrl: dto.seo.canonical_url ?? null,
  };
  return {
    id: dto.id,
    type: dto.type,
    title: dto.title,
    slug: dto.slug,
    excerpt: dto.excerpt ?? null,
    bodyMarkdown: dto.body_markdown,
    coverImageUrl: dto.cover_image_url ?? null,
    authorName: dto.author_name ?? null,
    publishedAt: dto.published_at ?? null,
    linkedProducts: dto.linked_products.map((p) => ({
      id: p.id, name: p.name, slug: p.slug,
      basePriceVnd: p.base_price_vnd, primaryImageUrl: p.primary_image_url ?? null,
    })),
    linkedCategories: dto.linked_categories,
    relatedGuides: dto.related_guides.map(mapGuideCardDTOtoViewModel),
    seo,
    breadcrumbs: dto.breadcrumbs,
  };
}
