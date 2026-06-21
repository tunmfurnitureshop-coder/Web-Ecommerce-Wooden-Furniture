import type { CollectionCardViewModel } from "../view-models/discovery.view-model";

interface CollectionCardDTO {
  id: string;
  code: string;
  name: string;
  slug: string;
  shortDescription?: string | null;
  coverImageUrl?: string | null;
  productCount?: number;
  publishedAt?: string | null;
}

export function mapCollectionCardDTOtoViewModel(dto: CollectionCardDTO): CollectionCardViewModel {
  return {
    id: dto.id,
    code: dto.code,
    slug: dto.slug,
    name: dto.name,
    shortDescription: dto.shortDescription ?? null,
    coverImageUrl: dto.coverImageUrl ?? null,
    productCount: dto.productCount ?? 0,
    publishedAt: dto.publishedAt ?? null,
  };
}
