export interface CartItemOptions {
  woodType: string;
  finish: string;
  size: string;
}

export interface CartItem {
  productId: string;
  quantity: number;
  selectedOptions: CartItemOptions;
}

export interface CartStorage {
  items: CartItem[];
}

export interface HydratedOptionLabel {
  code: string;
  label: string;
}

export interface HydratedCartItem {
  productId: string;
  sku: string;
  name: string;
  imageUrl: string | null;
  quantity: number;
  selectedOptions: {
    woodType: HydratedOptionLabel;
    finish: HydratedOptionLabel;
    size: HydratedOptionLabel;
  };
  unitPriceVnd: number;
  lineTotalVnd: number;
}

export interface HydratedCartResponse {
  items: HydratedCartItem[];
  subtotalVnd: number;
  totalVnd: number;
  currency: string;
}

export type CartHydrateResponse = HydratedCartResponse;

export function cartItemKey(item: CartItem): string {
  return `${item.productId}__${item.selectedOptions.woodType}__${item.selectedOptions.finish}__${item.selectedOptions.size}`;
}
