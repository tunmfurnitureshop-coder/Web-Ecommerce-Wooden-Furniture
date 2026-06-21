import type { OrderSummaryViewModel, OrderDetailViewModel, OrderItemViewModel } from "../view-models/order.view-model";
import type { OrderStatus } from "../enums/order-status.enum";
import type { PaymentStatus } from "../enums/payment-status.enum";

interface OrderItemDTO {
  productNameSnapshot: string;
  productSkuSnapshot: string;
  quantity: number;
  lineTotalVnd: number;
}

interface OrderSummaryDTO {
  orderCode: string;
  orderStatus: string;
  paymentStatus: string;
  subtotalVnd: number;
  shippingFeeVnd: number;
  totalVnd: number;
  createdAt?: string;
  items: OrderItemDTO[];
}

interface OrderDetailDTO extends OrderSummaryDTO {
  customerName: string;
  customerPhone: string;
  shippingAddress: string;
  note?: string | null;
  events: Array<{ status: string; note?: string | null; occurredAt: string }>;
}

export function mapOrderSummaryDTOtoViewModel(
  dto: OrderSummaryDTO,
  formatCurrency: (n: number) => string
): OrderSummaryViewModel {
  return {
    orderCode: dto.orderCode,
    orderStatus: dto.orderStatus as OrderStatus,
    paymentStatus: dto.paymentStatus as PaymentStatus,
    subtotalFormatted: formatCurrency(dto.subtotalVnd),
    shippingFeeFormatted: formatCurrency(dto.shippingFeeVnd),
    totalFormatted: formatCurrency(dto.totalVnd),
    createdAt: dto.createdAt ?? "",
    itemCount: dto.items.reduce((sum, item) => sum + item.quantity, 0),
  };
}

export function mapOrderDetailDTOtoViewModel(
  dto: OrderDetailDTO,
  formatCurrency: (n: number) => string
): OrderDetailViewModel {
  const items: OrderItemViewModel[] = dto.items.map((item) => ({
    productName: item.productNameSnapshot,
    productSku: item.productSkuSnapshot,
    quantity: item.quantity,
    lineTotalFormatted: formatCurrency(item.lineTotalVnd),
  }));

  return {
    ...mapOrderSummaryDTOtoViewModel(dto, formatCurrency),
    customerName: dto.customerName,
    customerPhone: dto.customerPhone,
    shippingAddress: dto.shippingAddress,
    note: dto.note ?? undefined,
    items,
    events: dto.events.map((e) => ({
      status: e.status as OrderStatus,
      note: e.note ?? undefined,
      occurredAt: e.occurredAt,
    })),
  };
}
