export type TagViewModel = {
  code: string;
  type: string;
  name: string;
  slug: string;
};

export type CollectionCardViewModel = {
  id: string;
  code: string;
  slug: string;
  name: string;
  shortDescription: string | null;
  coverImageUrl: string | null;
  productCount: number;
  publishedAt: string | null;
};

export type GuideCardViewModel = {
  id: string;
  type: string;
  title: string;
  slug: string;
  excerpt: string | null;
  coverImageUrl: string | null;
  authorName: string | null;
  publishedAt: string | null;
};

export type GuideDetailViewModel = {
  id: string;
  type: string;
  title: string;
  slug: string;
  excerpt: string | null;
  bodyMarkdown: string;
  coverImageUrl: string | null;
  authorName: string | null;
  publishedAt: string | null;
  linkedProducts: Array<{
    id: string;
    name: string;
    slug: string;
    basePriceVnd: number;
    primaryImageUrl: string | null;
  }>;
  linkedCategories: Array<{ code: string; name: string; slug: string }>;
  relatedGuides: GuideCardViewModel[];
  seo: SeoMetadataViewModel;
  breadcrumbs: Array<{ name: string; href: string }>;
};

export type SeoMetadataViewModel = {
  title: string | null;
  description: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  ogImageUrl: string | null;
  canonicalUrl: string | null;
  jsonLd?: Record<string, unknown>[];
};

export type RelatedProductViewModel = {
  id: string;
  name: string;
  slug: string;
  basePriceVnd: number;
  primaryImageUrl: string | null;
  relationSource: string;
};

export type RecentlyViewedItemViewModel = {
  id: string;
  name: string;
  slug: string;
  basePriceVnd: number;
  primaryImageUrl: string | null;
};

export type MaterialLandingViewModel = {
  code: string;
  name: string;
  slug: string;
  description: string | null;
  products: Array<{
    id: string;
    name: string;
    slug: string;
    basePriceVnd: number;
    primaryImageUrl: string | null;
  }>;
  relatedGuides: GuideCardViewModel[];
  seo: SeoMetadataViewModel;
  breadcrumbs: Array<{ name: string; href: string }>;
};

export type CategoryLandingViewModel = {
  code: string;
  name: string;
  slug: string;
  description: string | null;
  featuredProducts: Array<{
    id: string;
    name: string;
    slug: string;
    basePriceVnd: number;
    primaryImageUrl: string | null;
  }>;
  availableTags: TagViewModel[];
  featuredCollections: CollectionCardViewModel[];
  seo: SeoMetadataViewModel;
  breadcrumbs: Array<{ name: string; href: string }>;
};
