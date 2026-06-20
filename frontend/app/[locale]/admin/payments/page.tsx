"use client";

import { useEffect, useState } from "react";
import { getAdminToken } from "@/lib/auth";
import { listAdminPayments } from "@/features/payment/payment.api";
import type { PaymentTransaction } from "@/features/payment/payment.types";
import { formatVnd } from "@/lib/format-currency";

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Đang chờ",
  PAID: "Đã thanh toán",
  FAILED: "Thất bại",
  CANCELLED: "Đã hủy",
  EXPIRED: "Hết hạn",
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: "text-yellow-600",
  PAID: "text-green-600",
  FAILED: "text-red-600",
  CANCELLED: "text-gray-500",
};

export default function AdminPaymentsPage() {
  const [items, setItems] = useState<PaymentTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const PAGE_SIZE = 20;

  useEffect(() => {
    const token = getAdminToken();
    if (!token) return;
    setLoading(true);
    listAdminPayments(token, { page, pageSize: PAGE_SIZE })
      .then((res) => { setItems(res.items); setTotal(res.total); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Giao dịch thanh toán</h1>

      {loading ? (
        <p className="text-muted-foreground">Đang tải...</p>
      ) : (
        <>
          <div className="overflow-x-auto rounded border">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-3 text-left">Provider</th>
                  <th className="px-4 py-3 text-left">Trạng thái</th>
                  <th className="px-4 py-3 text-left">Số tiền</th>
                  <th className="px-4 py-3 text-left">Mã GD provider</th>
                  <th className="px-4 py-3 text-left">Ngày tạo</th>
                  <th className="px-4 py-3 text-left">Thanh toán lúc</th>
                </tr>
              </thead>
              <tbody>
                {items.map((tx) => (
                  <tr key={tx.id} className="border-t">
                    <td className="px-4 py-3 font-medium">{tx.provider}</td>
                    <td className={`px-4 py-3 font-medium ${STATUS_COLORS[tx.status] ?? ""}`}>
                      {STATUS_LABELS[tx.status] ?? tx.status}
                    </td>
                    <td className="px-4 py-3">{formatVnd(tx.amountVnd)}</td>
                    <td className="px-4 py-3 font-mono text-xs">{tx.providerOrderCode ?? "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{new Date(tx.createdAt).toLocaleString("vi-VN")}</td>
                    <td className="px-4 py-3 text-muted-foreground">{tx.paidAt ? new Date(tx.paidAt).toLocaleString("vi-VN") : "—"}</td>
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Chưa có giao dịch</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Tổng: {total}</span>
            <div className="flex gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 border rounded disabled:opacity-50">
                Trước
              </button>
              <span className="px-3 py-1">Trang {page}</span>
              <button onClick={() => setPage((p) => p + 1)} disabled={page * PAGE_SIZE >= total} className="px-3 py-1 border rounded disabled:opacity-50">
                Tiếp
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
