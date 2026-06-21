import type { TagViewModel } from "../view-models/discovery.view-model";

interface TagDTO {
  code: string;
  type: string;
  name: string;
  slug: string;
}

export function mapTagDTOtoViewModel(dto: TagDTO): TagViewModel {
  return {
    code: dto.code,
    type: dto.type,
    name: dto.name,
    slug: dto.slug,
  };
}
