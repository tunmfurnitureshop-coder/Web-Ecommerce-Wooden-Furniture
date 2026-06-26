import { api } from "@/lib/api";
import type {
  ProductListResponse,
  ProductDetail,
  PricingQuoteRequest,
  PricingQuoteResponse,
  ProductCatalogFilters,
  BestSellerListResponse,
  DealListResponse,
} from "./product.types";

export async function getProducts(
  filters: ProductCatalogFilters
): Promise<ProductListResponse> {
  const params = new URLSearchParams();
  params.set("locale", filters.locale);
  if (filters.room) params.set("room", filters.room);
  if (filters.woodType) params.set("woodType", filters.woodType);
  if (filters.minPrice) params.set("minPrice", String(filters.minPrice));
  if (filters.maxPrice) params.set("maxPrice", String(filters.maxPrice));
  if (filters.page) params.set("page", String(filters.page));
  if (filters.pageSize) params.set("pageSize", String(filters.pageSize));
  if (filters.campaign) params.set("campaign", filters.campaign);

  return api.get<ProductListResponse>(`/api/v1/products?${params.toString()}`);
}

export async function getProductDetail(
  slug: string,
  locale: string
): Promise<ProductDetail> {
  return api.get<ProductDetail>(
    `/api/v1/products/${slug}?locale=${locale}`
  );
}

export async function getPricingQuote(
  data: PricingQuoteRequest
): Promise<PricingQuoteResponse> {
  return api.post<PricingQuoteResponse>("/api/v1/pricing/quote", data);
}

export async function getBestSellers(
  locale: string,
  limit = 12
): Promise<BestSellerListResponse> {
  return api.get<BestSellerListResponse>(
    `/api/v1/products/best-sellers?locale=${locale}&limit=${limit}`
  );
}

export async function getDeals(
  locale: string,
  limit = 12
): Promise<DealListResponse> {
  return api.get<DealListResponse>(
    `/api/v1/products/deals?locale=${locale}&limit=${limit}`
  );
}
