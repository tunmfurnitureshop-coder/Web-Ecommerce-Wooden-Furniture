import { formatCurrency } from "@/lib/format-currency";
import type { ProductCardViewModel } from "./product-card";

/** Minimal shape returned by related/discovery product endpoints. */
export interface RelatedProductLike {
  id: string;
  name: string;
  slug: string;
  basePriceVnd: number;
  primaryImageUrl?: string | null;
}

/** Map a discovery/related product into the shared ProductCard view model. */
export function mapRelatedToCard(p: RelatedProductLike): ProductCardViewModel {
  return {
    id: p.id,
    slug: p.slug,
    title: p.name,
    primaryImageUrl: p.primaryImageUrl ?? "/images/placeholder-product.jpg",
    imageAlt: p.name,
    priceFormatted: formatCurrency(p.basePriceVnd),
    isAvailable: true,
    isWishlisted: false,
  };
}
