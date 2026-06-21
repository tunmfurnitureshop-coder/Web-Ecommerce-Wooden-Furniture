import type { CartItemViewModel } from "../view-models/cart.view-model";

interface CartHydratedItemDTO {
  productId: string;
  sku: string;
  name: string;
  imageUrl?: string | null;
  quantity: number;
  selectedOptions: {
    woodType: { code: string; label: string };
    finish: { code: string; label: string };
    size: { code: string; label: string };
  };
  unitPriceVnd: number;
  lineTotalVnd: number;
}

export function mapCartItemDTOtoViewModel(
  dto: CartHydratedItemDTO,
  formatCurrency: (n: number) => string
): CartItemViewModel {
  return {
    id: dto.sku,
    productId: dto.productId,
    productName: dto.name,
    productSlug: dto.productId,
    imageUrl: dto.imageUrl ?? "/images/placeholder-product.jpg",
    selectedOptionsLabel: [
      dto.selectedOptions.woodType.label,
      dto.selectedOptions.finish.label,
      dto.selectedOptions.size.label,
    ],
    quantity: dto.quantity,
    unitPriceFormatted: formatCurrency(dto.unitPriceVnd),
    lineTotalFormatted: formatCurrency(dto.lineTotalVnd),
    availabilityState: "AVAILABLE",
  };
}
