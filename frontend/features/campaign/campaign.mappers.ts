import type { CampaignDetailResponse, CampaignListItem, FeaturedProductItem } from "./campaign.types";
import { formatCurrency } from "@/lib/format-currency";

export interface CampaignHeroViewModel {
  name: string;
  shortDescription: string | null;
  heroImageUrl: string | null;
  endsAt: string | null;
}

export interface CampaignProductViewModel {
  id: string;
  name: string;
  slug: string;
  priceFormatted: string;
  imageUrl: string | null;
}

export function mapCampaignToHeroViewModel(c: CampaignDetailResponse): CampaignHeroViewModel {
  return {
    name: c.name,
    shortDescription: c.shortDescription,
    heroImageUrl: c.heroImageUrl,
    endsAt: c.endsAt,
  };
}

export function mapFeaturedProductToViewModel(p: FeaturedProductItem): CampaignProductViewModel {
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    priceFormatted: formatCurrency(p.basePriceVnd),
    imageUrl: p.heroImageUrl,
  };
}

export interface HeroSlideViewModel {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  mobileImageUrl: string | null;
}

/** Map a HOME_HERO campaign list item into a homepage slideshow slide. */
export function mapCampaignToHeroSlide(c: CampaignListItem): HeroSlideViewModel {
  return {
    id: c.id,
    name: c.name,
    slug: c.slug,
    imageUrl: c.heroImageUrl,
    mobileImageUrl: c.mobileHeroImageUrl,
  };
}
