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
