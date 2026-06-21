import type { RelatedProductViewModel, RecentlyViewedItemViewModel } from "../view-models/discovery.view-model";

interface RelatedProductDTO {
  id: string;
  name: string;
  slug: string;
  basePriceVnd: number;
  primaryImageUrl?: string | null;
  relationSource: string;
}

interface RecentlyViewedItemDTO {
  id: string;
  name: string;
  slug: string;
  basePriceVnd: number;
  primaryImageUrl?: string | null;
}

export function mapRelatedProductDTOtoViewModel(dto: RelatedProductDTO): RelatedProductViewModel {
  return {
    id: dto.id,
    name: dto.name,
    slug: dto.slug,
    basePriceVnd: dto.basePriceVnd,
    primaryImageUrl: dto.primaryImageUrl ?? null,
    relationSource: dto.relationSource,
  };
}

export function mapRecentlyViewedDTOtoViewModel(dto: RecentlyViewedItemDTO): RecentlyViewedItemViewModel {
  return {
    id: dto.id,
    name: dto.name,
    slug: dto.slug,
    basePriceVnd: dto.basePriceVnd,
    primaryImageUrl: dto.primaryImageUrl ?? null,
  };
}
