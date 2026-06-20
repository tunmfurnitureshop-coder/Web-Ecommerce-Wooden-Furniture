export interface PaymentTransaction {
  id: string;
  orderId: string;
  provider: string;
  status: string;
  amountVnd: number;
  providerOrderCode: string | null;
  checkoutUrl: string | null;
  paidAt: string | null;
  createdAt: string;
}

export interface AdminPaymentListResponse {
  items: PaymentTransaction[];
  page: number;
  pageSize: number;
  total: number;
}
