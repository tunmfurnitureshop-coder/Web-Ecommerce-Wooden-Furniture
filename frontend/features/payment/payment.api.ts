import { api } from "@/lib/api";
import type { AdminPaymentListResponse } from "./payment.types";

export async function listAdminPayments(
  token: string,
  params: { page?: number; pageSize?: number; status?: string } = {}
): Promise<AdminPaymentListResponse> {
  const qs = new URLSearchParams();
  if (params.page) qs.set("page", String(params.page));
  if (params.pageSize) qs.set("pageSize", String(params.pageSize));
  if (params.status) qs.set("status", params.status);
  const url = `/api/v1/admin/payments${qs.toString() ? `?${qs}` : ""}`;
  return api.get<AdminPaymentListResponse>(url, { Authorization: `Bearer ${token}` });
}
