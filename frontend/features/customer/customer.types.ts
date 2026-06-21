export interface CustomerPublic {
  id: string;
  email: string;
  fullName: string | null;
  phone: string | null;
  isEmailVerified: boolean;
  createdAt: string;
}

export interface CustomerAddress {
  id: string;
  recipientName: string;
  phone: string;
  provinceCode: string | null;
  districtCode: string | null;
  wardCode: string | null;
  fullAddress: string;
  isDefault: boolean;
  createdAt: string;
}

export interface CreateAddressBody {
  recipientName: string;
  phone: string;
  fullAddress: string;
  isDefault?: boolean;
}

export interface CustomerOrderListItem {
  orderCode: string;
  createdAt: string;
  totalVnd: number;
  paymentStatus: string;
  orderStatus: string;
  itemCount: number;
  primaryImageUrl: string | null;
}

export interface CustomerOrderListResponse {
  items: CustomerOrderListItem[];
  page: number;
  pageSize: number;
  total: number;
}

export interface CustomerOrderItem {
  productId: string;
  productNameSnapshot: string;
  productSkuSnapshot: string;
  selectedOptionsSnapshot: Record<string, unknown>;
  unitPriceVnd: number;
  quantity: number;
  lineTotalVnd: number;
}

export interface OrderEvent {
  eventType: string;
  actorType: string;
  note: string | null;
  createdAt: string;
}

export interface CustomerOrderDetail {
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
  items: CustomerOrderItem[];
  events: OrderEvent[];
}

export interface ReorderResponse {
  items: {
    productId: string;
    quantity: number;
    selectedOptions: { woodType: string; finish: string; size: string };
    currentUnitPriceVnd: number;
  }[];
  unavailableItems: { productId: string; productSkuSnapshot: string; reason: string }[];
}
