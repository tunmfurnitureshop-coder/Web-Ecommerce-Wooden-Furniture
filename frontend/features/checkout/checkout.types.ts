export type PaymentMethod = "COD" | "BANK_TRANSFER" | "MOCK_PROVIDER";

export interface CheckoutFormData {
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  shippingAddress: string;
  note?: string;
  paymentMethod: PaymentMethod;
}

export interface OrderItemRequest {
  productId: string;
  quantity: number;
  selectedOptions: {
    woodType: string;
    finish: string;
    size: string;
  };
}

export interface CreateOrderRequest extends CheckoutFormData {
  items: OrderItemRequest[];
}

export interface CreateOrderResponse {
  orderCode: string;
  orderStatus: string;
  paymentStatus: string;
  totalVnd: number;
  currency: string;
}

export interface OrderSummary {
  orderCode: string;
  customerName: string;
  orderStatus: string;
  paymentStatus: string;
  paymentMethod: string;
  items: OrderSummaryItem[];
  totalVnd: number;
  currency: string;
  createdAt: string;
}

export interface OrderSummaryItem {
  productNameSnapshot: string;
  productSkuSnapshot: string;
  selectedOptionsSnapshot: Record<string, unknown>;
  unitPriceVnd: number;
  quantity: number;
  lineTotalVnd: number;
}
