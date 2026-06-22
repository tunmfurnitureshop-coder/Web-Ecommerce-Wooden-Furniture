export interface CampaignLandingViewModel {
  id: string;
  code: string;
  name: string;
  slug: string;
  shortDescription: string | null;
  heroImageUrl: string | null;
  endsAt: string | null;
  productCount: number;
  collectionCount: number;
}

export interface CampaignMetricViewModel {
  productViews: number;
  addToCartCount: number;
  checkoutStartedCount: number;
  purchaseCompletedCount: number;
  campaignRevenueVnd: number;
  campaignRevenueFormatted: string;
  conversionRate: number;
  conversionRateFormatted: string;
}
