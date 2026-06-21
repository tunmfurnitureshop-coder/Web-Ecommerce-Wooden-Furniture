import { api } from "@/lib/api";

interface RecentlyViewedItem {
  id: string;
  name: string;
  slug: string;
  basePriceVnd: number;
  primaryImageUrl?: string | null;
}

export async function hydrateRecentlyViewed(
  productIds: string[],
  locale: string
): Promise<RecentlyViewedItem[]> {
  if (!productIds.length) return [];
  try {
    const res = await api.post<{ items: RecentlyViewedItem[] }>(
      "/api/v1/discovery/recently-viewed/hydrate",
      { productIds, locale }
    );
    return res.items;
  } catch {
    return [];
  }
}
