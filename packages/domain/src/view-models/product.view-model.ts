export interface ProductCardViewModel {
  id: string;
  slug: string;
  name: string;
  imageUrl: string | null;
  basePriceVnd: number;
  averageRating?: number;
  reviewCount?: number;
  isWishlisted?: boolean;
  roomSlug?: string;
}

export interface ProductDetailViewModel {
  id: string;
  sku: string;
  slug: string;
  name: string;
  description?: string | null;
  shortDescription?: string | null;
  basePriceVnd: number;
  primaryImageUrl?: string | null;
  averageRating?: number;
  reviewCount?: number;
  specifications?: Record<string, string> | null;
  availableOptions: {
    woodTypes: Array<{ code: string; name: string; priceDeltaVnd: number }>;
    finishes: Array<{ code: string; name: string; priceDeltaVnd: number }>;
    sizes: Array<{
      code: string;
      name: string;
      priceDeltaVnd: number;
      widthCm?: number | null;
      depthCm?: number | null;
      heightCm?: number | null;
    }>;
  };
  images: Array<{
    id: string;
    imageUrl: string;
    altText?: string | null;
    sortOrder: number;
    isPrimary: boolean;
    linkedFinishCode?: string | null;
  }>;
}
