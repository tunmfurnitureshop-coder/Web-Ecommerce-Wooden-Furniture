import type { ProductCardViewModel, ProductDetailViewModel } from "../view-models/product.view-model";

interface ProductCatalogItemDTO {
  id: string;
  sku: string;
  name: string;
  slug: string;
  basePriceVnd: number;
  primaryImageUrl?: string | null;
  shortDescription?: string | null;
  averageRating?: number | null;
  reviewCount?: number | null;
  room?: { slug?: string } | null;
}

interface ProductDetailDTO {
  id: string;
  sku: string;
  name: string;
  slug: string;
  description?: string | null;
  shortDescription?: string | null;
  basePriceVnd: number;
  primaryImageUrl?: string | null;
  averageRating?: number | null;
  reviewCount?: number | null;
  specifications?: Record<string, unknown> | null;
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

export function mapProductCardDTOtoViewModel(dto: ProductCatalogItemDTO): ProductCardViewModel {
  return {
    id: dto.id,
    slug: dto.slug,
    name: dto.name,
    imageUrl: dto.primaryImageUrl ?? null,
    basePriceVnd: dto.basePriceVnd,
    averageRating: dto.averageRating ?? undefined,
    reviewCount: dto.reviewCount ?? undefined,
    roomSlug: dto.room?.slug ?? undefined,
  };
}

export function mapProductDetailDTOtoViewModel(dto: ProductDetailDTO): ProductDetailViewModel {
  return {
    id: dto.id,
    sku: dto.sku,
    slug: dto.slug,
    name: dto.name,
    description: dto.description,
    shortDescription: dto.shortDescription,
    basePriceVnd: dto.basePriceVnd,
    primaryImageUrl: dto.primaryImageUrl,
    averageRating: dto.averageRating ?? undefined,
    reviewCount: dto.reviewCount ?? undefined,
    specifications: dto.specifications as Record<string, string> | null,
    availableOptions: dto.availableOptions,
    images: dto.images,
  };
}
