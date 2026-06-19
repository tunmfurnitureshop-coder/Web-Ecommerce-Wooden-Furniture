import { api } from "@/lib/api";
import type {
  CreateOrderRequest,
  CreateOrderResponse,
  OrderSummary,
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
