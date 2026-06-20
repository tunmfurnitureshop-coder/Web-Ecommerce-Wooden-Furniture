import { api } from "@/lib/api";
import type {
  CreateOrderRequest,
  CreateOrderResponse,
  OrderSummary,
  OrderPaymentStatus,
} from "./checkout.types";

export async function createOrder(
  data: CreateOrderRequest
): Promise<CreateOrderResponse> {
  return api.post<CreateOrderResponse>("/api/v1/orders", data);
}

export async function getOrderSummary(
  orderCode: string
): Promise<OrderSummary> {
  return api.get<OrderSummary>(`/api/v1/orders/${orderCode}`);
}

export async function getOrderPaymentStatus(
  orderCode: string
): Promise<OrderPaymentStatus> {
  return api.get<OrderPaymentStatus>(`/api/v1/orders/${orderCode}/payment-status`);
}

export async function retryPayment(orderCode: string): Promise<{ orderCode: string; checkoutUrl: string }> {
  return api.post(`/api/v1/orders/${orderCode}/payments/retry`, {});
}
