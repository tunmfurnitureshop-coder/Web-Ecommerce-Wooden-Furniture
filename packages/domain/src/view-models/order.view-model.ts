import type { OrderStatus } from "../enums/order-status.enum";
import type { PaymentStatus } from "../enums/payment-status.enum";

export interface OrderItemViewModel {
  productName: string;
  productSku: string;
  quantity: number;
  lineTotalFormatted: string;
}

export interface OrderSummaryViewModel {
  orderCode: string;
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  subtotalFormatted: string;
  shippingFeeFormatted: string;
  totalFormatted: string;
  createdAt: string;
  itemCount: number;
}

export interface OrderDetailViewModel extends OrderSummaryViewModel {
  customerName: string;
  customerPhone: string;
  shippingAddress: string;
  note?: string;
  items: OrderItemViewModel[];
  events: Array<{
    status: OrderStatus;
    note?: string;
    occurredAt: string;
  }>;
}
