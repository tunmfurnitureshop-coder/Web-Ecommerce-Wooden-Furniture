export interface AdminLoginRequest {
  email: string;
  password: string;
}

export interface AdminLoginResponse {
  accessToken: string;
  tokenType: string;
}

export interface AdminProductInventory {
  totalQty: number;
  reservedQty: number;
  availableQty: number;
}

export interface AdminProductListItem {
  id: string;
  sku: string;
  nameVi: string;
  basePriceVnd: number;
  status: "ACTIVE" | "INACTIVE";
  inventory: AdminProductInventory;
}

export interface AdminProductListResponse {
  items: AdminProductListItem[];
}

export interface ProductTranslation {
  name: string;
  slug: string;
  shortDescription?: string;
  description?: string;
  specifications?: Record<string, string>;
}

export interface CreateProductRequest {
  sku: string;
  roomCategoryCode: string;
  basePriceVnd: number;
  primaryImageUrl?: string;
  status: "ACTIVE" | "INACTIVE";
  translations: {
    vi: ProductTranslation;
    "zh-CN"?: ProductTranslation;
  };
  optionCodes: {
    woodTypes: string[];
    finishes: string[];
    sizes: string[];
  };
  inventory: {
    totalQty: number;
  };
}

export interface UpdateProductRequest extends Partial<CreateProductRequest> {}

export interface AdminInventoryItem {
  productId: string;
  sku: string;
  nameVi: string;
  totalQty: number;
  reservedQty: number;
  availableQty: number;
}

export interface AdminInventoryListResponse {
  items: AdminInventoryItem[];
}

export interface AdminOrderListItem {
  id: string;
  orderCode: string;
  customerName: string;
  customerPhone: string;
  totalVnd: number;
  orderStatus: string;
  paymentStatus: string;
  paymentMethod: string;
  createdAt: string;
}

export interface AdminOrderListResponse {
  items: AdminOrderListItem[];
  page: number;
  pageSize: number;
  total: number;
}

export interface AdminPaymentTx {
  id: string;
  provider: string;
  status: string;
  amountVnd: number;
  providerOrderCode: string | null;
  checkoutUrl: string | null;
  paidAt: string | null;
  createdAt: string;
}

export interface AdminOrderEvent {
  id: string;
  eventType: string;
  actorType: string;
  oldValue: Record<string, unknown> | null;
  newValue: Record<string, unknown> | null;
  note: string | null;
  createdAt: string;
}

export interface AdminEmailLog {
  id: string;
  recipientEmail: string;
  subject: string;
  templateKey: string;
  status: string;
  sentAt: string | null;
  createdAt: string;
}

export interface AdminOrderDetail {
  id: string;
  orderCode: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  shippingAddress: string;
  note: string | null;
  subtotalVnd: number;
  shippingFeeVnd: number;
  totalVnd: number;
  orderStatus: string;
  paymentStatus: string;
  paymentMethod: string;
  createdAt: string;
  items: AdminOrderItem[];
  paymentTransactions: AdminPaymentTx[];
  orderEvents: AdminOrderEvent[];
  emailLogs: AdminEmailLog[];
}

export interface AdminOrderItem {
  id: string;
  productNameSnapshot: string;
  productSkuSnapshot: string;
  selectedOptionsSnapshot: Record<string, unknown>;
  unitPriceVnd: number;
  quantity: number;
  lineTotalVnd: number;
}

export interface DashboardSummary {
  totalOrders: number;
  totalRevenueVnd: number;
  pendingOrders: number;
  paidOrders: number;
  lowStockProducts: number;
  cancelledOrders: number;
  newOrdersToday: number;
  revenueTodayVnd: number;
  failedPayments: number;
}

export interface AdminOrderFilters {
  orderStatus?: string;
  paymentStatus?: string;
  paymentMethod?: string;
  page?: number;
  pageSize?: number;
}

export interface WoodTypeOption {
  id: string;
  code: string;
  name: string;
}

export interface FinishOptionAdmin {
  id: string;
  code: string;
  name: string;
}

export interface SizeOptionAdmin {
  id: string;
  code: string;
  name: string;
}

export interface AdminOptionsResponse {
  woodTypes: WoodTypeOption[];
  finishes: FinishOptionAdmin[];
  sizes: SizeOptionAdmin[];
  roomCategories: { code: string; name: string }[];
}

export type AdminProduct = AdminProductListItem;
export type InventoryItem = AdminInventoryItem;
export type AdminOrder = AdminOrderListItem;

// Tags
export interface AdminTagTranslation {
  locale: string;
  name: string;
  slug: string;
  description?: string;
}
export interface AdminTag {
  id: string;
  code: string;
  type: string;
  is_active: boolean;
  sort_order: number;
  translations: AdminTagTranslation[];
}
export interface AdminTagListResponse { items: AdminTag[]; }
export interface CreateTagRequest {
  code: string;
  type: string;
  sort_order?: number;
  translations: AdminTagTranslation[];
}

// Collections
export interface AdminCollectionTranslation {
  locale: string;
  name: string;
  slug: string;
  short_description?: string;
  description_markdown?: string;
  meta_title?: string;
  meta_description?: string;
  og_title?: string;
  og_description?: string;
  og_image_url?: string;
}
export interface AdminCollectionProduct {
  product_id: string;
  sort_order: number;
  name?: string;
  sku?: string;
}
export interface AdminCollection {
  id: string;
  code: string;
  status: string;
  is_featured: boolean;
  cover_image_url?: string | null;
  published_at?: string | null;
  translations: AdminCollectionTranslation[];
  products: AdminCollectionProduct[];
}
export interface AdminCollectionListResponse { items: AdminCollection[]; total: number; }
export interface CreateCollectionRequest {
  code: string;
  status: string;
  is_featured: boolean;
  cover_image_url?: string;
  translations: AdminCollectionTranslation[];
}

// Content
export interface AdminContentTranslation {
  locale: string;
  title: string;
  slug: string;
  excerpt?: string;
  body_markdown?: string;
  meta_title?: string;
  meta_description?: string;
  og_title?: string;
  og_description?: string;
  og_image_url?: string;
}
export interface AdminContent {
  id: string;
  type: string;
  status: string;
  cover_image_url?: string | null;
  author_name?: string | null;
  scheduled_at?: string | null;
  published_at?: string | null;
  translations: AdminContentTranslation[];
  linked_products: Array<{ product_id: string; name?: string }>;
  linked_categories: Array<{ category_code: string; name?: string }>;
}
export interface AdminContentListResponse { items: AdminContent[]; total: number; }
export interface CreateContentRequest {
  type: string;
  status: string;
  cover_image_url?: string;
  author_name?: string;
  scheduled_at?: string;
  translations: AdminContentTranslation[];
}

// Product Relations
export interface AdminProductRelation {
  id: string;
  related_product_id: string;
  relation_type: string;
  sort_order: number;
  related_name?: string;
  related_sku?: string;
}
export interface CreateRelationRequest {
  related_product_id: string;
  relation_type: string;
  sort_order?: number;
}
