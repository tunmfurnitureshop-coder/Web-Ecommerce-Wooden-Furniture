export interface CartItemViewModel {
  id: string;
  productId: string;
  productName: string;
  productSlug: string;
  imageUrl: string;
  selectedOptionsLabel: string[];
  quantity: number;
  unitPriceFormatted: string;
  lineTotalFormatted: string;
  availabilityState: "AVAILABLE" | "LOW_STOCK" | "OUT_OF_STOCK" | "DISCONTINUED";
}

export interface CartSummaryViewModel {
  items: CartItemViewModel[];
  subtotalVnd: number;
  totalVnd: number;
  currency: string;
}
