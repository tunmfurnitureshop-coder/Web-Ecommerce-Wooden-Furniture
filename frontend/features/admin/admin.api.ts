import { api } from "@/lib/api";
import { getAuthHeaders } from "@/lib/auth";
import type {
  AdminLoginResponse,
  AdminProductListItem,
  AdminProductListResponse,
  AdminInventoryListResponse,
  AdminOrderListResponse,
  AdminOrderDetail,
  DashboardSummary,
  CreateProductRequest,
  UpdateProductRequest,
} from "./admin.types";

export async function adminLogin(
  email: string,
  password: string
): Promise<AdminLoginResponse> {
  return api.post<AdminLoginResponse>("/api/v1/admin/auth/login", { email, password });
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  return api.get<DashboardSummary>("/api/v1/admin/dashboard/summary", getAuthHeaders());
}

export async function adminListProducts(): Promise<AdminProductListResponse> {
  return api.get<AdminProductListResponse>("/api/v1/admin/products", getAuthHeaders());
}

export async function adminGetProduct(productId: string): Promise<AdminProductListItem> {
  return api.get<AdminProductListItem>(`/api/v1/admin/products/${productId}`, getAuthHeaders());
}

export async function adminCreateProduct(data: CreateProductRequest): Promise<{ id: string }> {
  return api.post<{ id: string }>("/api/v1/admin/products", data, getAuthHeaders());
}

export async function adminUpdateProduct(productId: string, data: UpdateProductRequest): Promise<void> {
  return api.patch<void>(`/api/v1/admin/products/${productId}`, data, getAuthHeaders());
}

export async function adminListInventory(): Promise<AdminInventoryListResponse> {
  return api.get<AdminInventoryListResponse>("/api/v1/admin/inventory", getAuthHeaders());
}

export async function adminUpdateInventory(
  productId: string,
  body: { totalQty: number }
): Promise<void> {
  return api.patch<void>(`/api/v1/admin/inventory/${productId}`, body, getAuthHeaders());
}

export async function adminListOrders(filters: {
  orderStatus?: string;
  paymentStatus?: string;
  paymentMethod?: string;
  page?: number;
  pageSize?: number;
} = {}): Promise<AdminOrderListResponse> {
  const params = new URLSearchParams();
  if (filters.orderStatus) params.set("orderStatus", filters.orderStatus);
  if (filters.paymentStatus) params.set("paymentStatus", filters.paymentStatus);
  if (filters.paymentMethod) params.set("paymentMethod", filters.paymentMethod);
  if (filters.page) params.set("page", String(filters.page));
  if (filters.pageSize) params.set("pageSize", String(filters.pageSize));
  const query = params.toString();
  return api.get<AdminOrderListResponse>(
    `/api/v1/admin/orders${query ? `?${query}` : ""}`,
    getAuthHeaders()
  );
}

export async function adminGetOrder(orderId: string): Promise<AdminOrderDetail> {
  return api.get<AdminOrderDetail>(`/api/v1/admin/orders/${orderId}`, getAuthHeaders());
}

export async function adminUpdateOrderStatus(
  orderId: string,
  data: { orderStatus?: string; paymentStatus?: string }
): Promise<{ orderCode: string; orderStatus: string; paymentStatus: string }> {
  return api.patch<{ orderCode: string; orderStatus: string; paymentStatus: string }>(
    `/api/v1/admin/orders/${orderId}/status`,
    data,
    getAuthHeaders()
  );
}
