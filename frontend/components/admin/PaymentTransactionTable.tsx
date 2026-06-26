"use client";

import { formatVnd } from "@/lib/format-currency";
import type { AdminPaymentTx } from "@/features/admin/admin.types";

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Đang chờ",
  PAID: "Đã thanh toán",
  FAILED: "Thất bại",
  CANCELLED: "Đã hủy",
  EXPIRED: "Hết hạn",
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: "text-warning",
  PAID: "text-success",
  FAILED: "text-danger",
  CANCELLED: "text-text-muted",
  EXPIRED: "text-text-muted",
};

interface Props {
  transactions: AdminPaymentTx[];
}

export function PaymentTransactionTable({ transactions }: Props) {
  if (!transactions?.length) {
    return <p className="text-sm text-text-muted">Chưa có giao dịch nào.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-text-muted text-left">
            <th className="pb-2 pr-4">Provider</th>
            <th className="pb-2 pr-4">Trạng thái</th>
            <th className="pb-2 pr-4">Số tiền</th>
            <th className="pb-2 pr-4">Mã GD</th>
            <th className="pb-2">Ngày tạo</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((tx) => (
            <tr key={tx.id} className="border-b last:border-0">
              <td className="py-2 pr-4 font-medium">{tx.provider}</td>
              <td className={`py-2 pr-4 font-medium ${STATUS_COLORS[tx.status] ?? ""}`}>
                {STATUS_LABELS[tx.status] ?? tx.status}
              </td>
              <td className="py-2 pr-4">{formatVnd(tx.amountVnd)}</td>
              <td className="py-2 pr-4 font-mono text-xs">{tx.providerOrderCode ?? "—"}</td>
              <td className="py-2 text-text-muted">
                {new Date(tx.createdAt).toLocaleString("vi-VN")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
