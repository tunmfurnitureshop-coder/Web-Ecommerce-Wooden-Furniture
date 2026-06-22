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
  AdminTagListResponse,
  AdminTag,
  CreateTagRequest,
  AdminCollectionListResponse,
  AdminCollection,
  CreateCollectionRequest,
  AdminContentListResponse,
  AdminContent,
  CreateContentRequest,
  AdminProductRelation,
  CreateRelationRequest,
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

export async function adminConfirmManualPayment(
  orderId: string,
  note?: string
): Promise<{ orderCode: string; paymentStatus: string; orderStatus: string }> {
  return api.post(
    `/api/v1/admin/orders/${orderId}/confirm-manual-payment`,
    { note },
    getAuthHeaders()
  );
}

// Tags
export async function adminListTags(): Promise<AdminTagListResponse> {
  return api.get<AdminTagListResponse>("/api/v1/admin/tags", getAuthHeaders());
}
export async function adminGetTag(tagId: string): Promise<AdminTag> {
  return api.get<AdminTag>(`/api/v1/admin/tags/${tagId}`, getAuthHeaders());
}
export async function adminCreateTag(data: CreateTagRequest): Promise<AdminTag> {
  return api.post<AdminTag>("/api/v1/admin/tags", data, getAuthHeaders());
}
export async function adminUpdateTag(tagId: string, data: Partial<CreateTagRequest> & { is_active?: boolean }): Promise<AdminTag> {
  return api.patch<AdminTag>(`/api/v1/admin/tags/${tagId}`, data, getAuthHeaders());
}
export async function adminDeleteTag(tagId: string): Promise<void> {
  return api.delete<void>(`/api/v1/admin/tags/${tagId}`, getAuthHeaders());
}

// Collections
export async function adminListCollections(): Promise<AdminCollectionListResponse> {
  return api.get<AdminCollectionListResponse>("/api/v1/admin/collections", getAuthHeaders());
}
export async function adminGetCollection(collectionId: string): Promise<AdminCollection> {
  return api.get<AdminCollection>(`/api/v1/admin/collections/${collectionId}`, getAuthHeaders());
}
export async function adminCreateCollection(data: CreateCollectionRequest): Promise<AdminCollection> {
  return api.post<AdminCollection>("/api/v1/admin/collections", data, getAuthHeaders());
}
export async function adminUpdateCollection(collectionId: string, data: Partial<CreateCollectionRequest>): Promise<AdminCollection> {
  return api.patch<AdminCollection>(`/api/v1/admin/collections/${collectionId}`, data, getAuthHeaders());
}
export async function adminAddCollectionProduct(collectionId: string, productId: string, sortOrder?: number): Promise<void> {
  return api.post<void>(`/api/v1/admin/collections/${collectionId}/products`, { product_id: productId, sort_order: sortOrder ?? 0 }, getAuthHeaders());
}
export async function adminRemoveCollectionProduct(collectionId: string, productId: string): Promise<void> {
  return api.delete<void>(`/api/v1/admin/collections/${collectionId}/products/${productId}`, getAuthHeaders());
}

// Content
export async function adminListContent(): Promise<AdminContentListResponse> {
  return api.get<AdminContentListResponse>("/api/v1/admin/content", getAuthHeaders());
}
export async function adminGetContent(contentId: string): Promise<AdminContent> {
  return api.get<AdminContent>(`/api/v1/admin/content/${contentId}`, getAuthHeaders());
}
export async function adminCreateContent(data: CreateContentRequest): Promise<AdminContent> {
  return api.post<AdminContent>("/api/v1/admin/content", data, getAuthHeaders());
}
export async function adminUpdateContent(contentId: string, data: Partial<CreateContentRequest>): Promise<AdminContent> {
  return api.patch<AdminContent>(`/api/v1/admin/content/${contentId}`, data, getAuthHeaders());
}
export async function adminAddContentProduct(contentId: string, productId: string): Promise<void> {
  return api.post<void>(`/api/v1/admin/content/${contentId}/products`, { product_id: productId }, getAuthHeaders());
}
export async function adminRemoveContentProduct(contentId: string, productId: string): Promise<void> {
  return api.delete<void>(`/api/v1/admin/content/${contentId}/products/${productId}`, getAuthHeaders());
}
export async function adminAddContentCategory(contentId: string, categoryCode: string): Promise<void> {
  return api.post<void>(`/api/v1/admin/content/${contentId}/categories`, { category_code: categoryCode }, getAuthHeaders());
}
export async function adminRemoveContentCategory(contentId: string, categoryCode: string): Promise<void> {
  return api.delete<void>(`/api/v1/admin/content/${contentId}/categories/${categoryCode}`, getAuthHeaders());
}

// Product Relations
export async function adminListProductRelations(productId: string): Promise<{ items: AdminProductRelation[] }> {
  return api.get<{ items: AdminProductRelation[] }>(`/api/v1/admin/products/${productId}/relations`, getAuthHeaders());
}
export async function adminAddProductRelation(productId: string, data: CreateRelationRequest): Promise<AdminProductRelation> {
  return api.post<AdminProductRelation>(`/api/v1/admin/products/${productId}/relations`, data, getAuthHeaders());
}
export async function adminRemoveProductRelation(productId: string, relationId: string): Promise<void> {
  return api.delete<void>(`/api/v1/admin/products/${productId}/relations/${relationId}`, getAuthHeaders());
}

// Promotions
export async function adminListPromotions(page = 1, pageSize = 20) {
  return api.get<{ items: unknown[]; page: number; pageSize: number; total: number }>(
    `/api/v1/admin/promotions?page=${page}&pageSize=${pageSize}`,
    getAuthHeaders()
  );
}
export async function adminGetPromotion(id: string) {
  return api.get<Record<string, unknown>>(`/api/v1/admin/promotions/${id}`, getAuthHeaders());
}
export async function adminCreatePromotion(data: Record<string, unknown>) {
  return api.post<{ id: string; code: string; status: string }>("/api/v1/admin/promotions", data, getAuthHeaders());
}
export async function adminPatchPromotion(id: string, data: Record<string, unknown>) {
  return api.patch<{ id: string; code: string; status: string }>(`/api/v1/admin/promotions/${id}`, data, getAuthHeaders());
}
export async function adminDeletePromotion(id: string) {
  return api.delete<void>(`/api/v1/admin/promotions/${id}`, getAuthHeaders());
}
export async function adminGetPromotionMetrics(id: string, from?: string, to?: string) {
  const params = new URLSearchParams();
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  const q = params.toString();
  return api.get<Record<string, unknown>>(`/api/v1/admin/promotions/${id}/metrics${q ? `?${q}` : ""}`, getAuthHeaders());
}

// Campaigns
export async function adminListCampaigns(page = 1, pageSize = 20) {
  return api.get<{ items: unknown[]; page: number; pageSize: number; total: number }>(
    `/api/v1/admin/campaigns?page=${page}&pageSize=${pageSize}`,
    getAuthHeaders()
  );
}
export async function adminGetCampaign(id: string) {
  return api.get<Record<string, unknown>>(`/api/v1/admin/campaigns/${id}`, getAuthHeaders());
}
export async function adminCreateCampaign(data: Record<string, unknown>) {
  return api.post<{ id: string; code: string; status: string }>("/api/v1/admin/campaigns", data, getAuthHeaders());
}
export async function adminPatchCampaign(id: string, data: Record<string, unknown>) {
  return api.patch<{ id: string; code: string; status: string }>(`/api/v1/admin/campaigns/${id}`, data, getAuthHeaders());
}
export async function adminDeleteCampaign(id: string) {
  return api.delete<void>(`/api/v1/admin/campaigns/${id}`, getAuthHeaders());
}
export async function adminGetCampaignMetrics(id: string, from?: string, to?: string) {
  const params = new URLSearchParams();
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  const q = params.toString();
  return api.get<Record<string, unknown>>(`/api/v1/admin/campaigns/${id}/metrics${q ? `?${q}` : ""}`, getAuthHeaders());
}
