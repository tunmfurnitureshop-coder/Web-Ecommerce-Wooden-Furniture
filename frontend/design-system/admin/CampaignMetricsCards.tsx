import { formatCurrency } from "@/lib/format-currency";

interface CampaignMetrics {
  productViews: number;
  addToCartCount: number;
  checkoutStartedCount: number;
  purchaseCompletedCount: number;
  campaignRevenueVnd: number;
  conversionRate: number;
}

interface CampaignMetricsCardsProps {
  metrics: CampaignMetrics;
  labels: {
    productViews: string;
    addToCart: string;
    checkoutStarted: string;
    purchaseCompleted: string;
    revenue: string;
    conversionRate: string;
  };
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border-default bg-surface p-4 flex flex-col gap-1">
      <span className="text-xs text-text-muted">{label}</span>
      <span className="text-xl font-bold text-text-primary">{value}</span>
    </div>
  );
}

export function CampaignMetricsCards({ metrics, labels }: CampaignMetricsCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
      <MetricCard label={labels.productViews} value={metrics.productViews.toLocaleString()} />
      <MetricCard label={labels.addToCart} value={metrics.addToCartCount.toLocaleString()} />
      <MetricCard label={labels.checkoutStarted} value={metrics.checkoutStartedCount.toLocaleString()} />
      <MetricCard label={labels.purchaseCompleted} value={metrics.purchaseCompletedCount.toLocaleString()} />
      <MetricCard label={labels.revenue} value={formatCurrency(metrics.campaignRevenueVnd)} />
      <MetricCard label={labels.conversionRate} value={`${(metrics.conversionRate * 100).toFixed(2)}%`} />
    </div>
  );
}
