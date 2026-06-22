import type {
  CampaignLandingViewModel,
  CampaignMetricViewModel,
} from "../view-models/campaign.view-model";

interface CampaignDetailDTO {
  id: string;
  code: string;
  name: string;
  slug: string;
  shortDescription: string | null;
  heroImageUrl: string | null;
  endsAt: string | null;
  products: unknown[];
  collections: unknown[];
}

interface CampaignMetricsDTO {
  productViews: number;
  addToCartCount: number;
  checkoutStartedCount: number;
  purchaseCompletedCount: number;
  campaignRevenueVnd: number;
  conversionRate: number;
}

export function mapCampaignDTOtoLandingViewModel(
  dto: CampaignDetailDTO
): CampaignLandingViewModel {
  return {
    id: dto.id,
    code: dto.code,
    name: dto.name,
    slug: dto.slug,
    shortDescription: dto.shortDescription,
    heroImageUrl: dto.heroImageUrl,
    endsAt: dto.endsAt,
    productCount: dto.products.length,
    collectionCount: dto.collections.length,
  };
}

export function mapCampaignMetricsDTOtoViewModel(
  dto: CampaignMetricsDTO,
  formatCurrency: (n: number) => string
): CampaignMetricViewModel {
  return {
    productViews: dto.productViews,
    addToCartCount: dto.addToCartCount,
    checkoutStartedCount: dto.checkoutStartedCount,
    purchaseCompletedCount: dto.purchaseCompletedCount,
    campaignRevenueVnd: dto.campaignRevenueVnd,
    campaignRevenueFormatted: formatCurrency(dto.campaignRevenueVnd),
    conversionRate: dto.conversionRate,
    conversionRateFormatted: `${(dto.conversionRate * 100).toFixed(2)}%`,
  };
}
