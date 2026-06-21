export interface WishlistItem {
  productId: string;
  slug: string;
  name: string;
  primaryImageUrl: string | null;
  basePriceVnd: number;
  status: string;
  addedAt: string;
}

export interface WishlistResponse {
  items: WishlistItem[];
  total: number;
}
