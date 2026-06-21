import type { SeoMetadataViewModel } from "../view-models/discovery.view-model";

interface SeoMetadataDTO {
  meta_title?: string | null;
  meta_description?: string | null;
  og_title?: string | null;
  og_description?: string | null;
  og_image_url?: string | null;
  canonical_url?: string | null;
}

export function mapSeoMetadataDTOtoViewModel(dto: SeoMetadataDTO, fallbackTitle?: string): SeoMetadataViewModel {
  return {
    title: dto.meta_title ?? fallbackTitle ?? null,
    description: dto.meta_description ?? null,
    ogTitle: dto.og_title ?? dto.meta_title ?? fallbackTitle ?? null,
    ogDescription: dto.og_description ?? dto.meta_description ?? null,
    ogImageUrl: dto.og_image_url ?? null,
    canonicalUrl: dto.canonical_url ?? null,
  };
}
