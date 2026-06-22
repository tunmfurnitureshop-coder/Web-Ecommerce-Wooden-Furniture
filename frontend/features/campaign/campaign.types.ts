export interface CampaignListItem {
  id: string;
  code: string;
  name: string;
  slug: string;
  heroImageUrl: string | null;
  mobileHeroImageUrl: string | null;
  startsAt: string;
  endsAt: string | null;
}

export interface CampaignListResponse {
  items: CampaignListItem[];
}

export interface FeaturedProductItem {
  id: string;
  name: string;
  slug: string;
  basePriceVnd: number;
  heroImageUrl: string | null;
}

export interface FeaturedCollectionItem {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
}

export interface CampaignDetailResponse {
  id: string;
  code: string;
  name: string;
  slug: string;
  shortDescription: string | null;
  descriptionMarkdown: string | null;
  heroImageUrl: string | null;
  mobileHeroImageUrl: string | null;
  startsAt: string;
  endsAt: string | null;
  products: FeaturedProductItem[];
  collections: FeaturedCollectionItem[];
  metaTitle: string | null;
  metaDescription: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  ogImageUrl: string | null;
}
