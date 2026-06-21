export interface RoomCategory {
  code: string;
  name: string;
}

export interface ProductListItem {
  id: string;
  sku: string;
  name: string;
  slug: string;
  shortDescription: string | null;
  basePriceVnd: number;
  primaryImageUrl: string | null;
  room: RoomCategory;
}

export interface AppliedFilters {
  room?: string | null;
  woodType?: string | null;
  minPrice?: number | null;
  maxPrice?: number | null;
  sort?: string | null;
}

export interface ProductListResponse {
  items: ProductListItem[];
  page: number;
  pageSize: number;
  total: number;
  query?: string | null;
  appliedFilters?: AppliedFilters | null;
}

export interface SuggestionsResponse {
  products: Array<{ slug: string; name: string; primaryImageUrl: string | null }>;
  categories: Array<{ code: string; name: string }>;
  woodTypes: Array<{ code: string; name: string }>;
}

export interface WoodTypeOption {
  code: string;
  name: string;
  priceDeltaVnd: number;
}

export interface FinishOption {
  code: string;
  name: string;
  priceDeltaVnd: number;
  imageUrl: string | null;
}

export interface SizeOption {
  code: string;
  name: string;
  widthCm: number | null;
  depthCm: number | null;
  heightCm: number | null;
  priceDeltaVnd: number;
}

export interface ProductImageItem {
  id: string;
  imageUrl: string;
  altText: string | null;
  sortOrder: number;
  isPrimary: boolean;
  linkedFinishCode: string | null;
}

export interface ProductDetail {
  id: string;
  sku: string;
  name: string;
  slug: string;
  description: string | null;
  specifications: Record<string, string> | null;
  basePriceVnd: number;
  primaryImageUrl: string | null;
  availableOptions: {
    woodTypes: WoodTypeOption[];
    finishes: FinishOption[];
    sizes: SizeOption[];
  };
  images: ProductImageItem[];
}

export interface PricingQuoteRequest {
  productId: string;
  quantity: number;
  selectedOptions: {
    woodType: string;
    finish: string;
    size: string;
  };
}

export interface PricingQuoteResponse {
  productId: string;
  quantity: number;
  unitPriceVnd: number;
  lineTotalVnd: number;
  breakdown: {
    basePriceVnd: number;
    woodTypeDeltaVnd: number;
    finishDeltaVnd: number;
    sizeDeltaVnd: number;
  };
}

export interface ProductCatalogFilters {
  locale: string;
  q?: string;
  sort?: string;
  room?: string;
  woodType?: string;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  pageSize?: number;
}
