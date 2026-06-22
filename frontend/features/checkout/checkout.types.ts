export type PaymentMethod = "COD" | "BANK_TRANSFER" | "MOCK_PROVIDER" | "PAYOS";

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
  couponCode?: string;
  campaignCode?: string;
  cartRecoverySessionId?: string;
}

export interface CreateOrderResponse {
  orderCode: string;
  orderStatus: string;
  paymentStatus: string;
  paymentMethod: string;
  merchandiseSubtotalVnd?: number;
  promotionDiscountVnd?: number;
  totalDiscountVnd?: number;
  totalVnd: number;
  currency: string;
  checkoutUrl?: string;
  paymentTransactionId?: string;
}

export interface OrderPaymentStatus {
  orderCode: string;
  paymentStatus: string;
  orderStatus: string;
  paymentMethod: string;
  latestTransaction: {
    id: string;
    provider: string;
    status: string;
    amountVnd: number;
    paidAt: string | null;
  } | null;
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
