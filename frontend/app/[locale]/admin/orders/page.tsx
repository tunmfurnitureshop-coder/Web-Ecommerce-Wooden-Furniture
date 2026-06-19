"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/lib/i18n";
import { adminListOrders } from "@/features/admin/admin.api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatVnd } from "@/lib/format-currency";
import type { AdminOrder } from "@/features/admin/admin.types";

export default function AdminOrdersPage() {
  const t = useTranslations("admin");
  const tOrderStatus = useTranslations("orderStatus");
  const tPaymentStatus = useTranslations("paymentStatus");
  const tPayment = useTranslations("payment");
  const [orders, setOrders] = useState<AdminOrder[]>([]);

  useEffect(() => {
    adminListOrders().then((r) => setOrders(r.items)).catch(console.error);
  }, []);

  return (
    <div>
      <h1 className="text-xl font-bold mb-6">{t("orders")}</h1>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th className="pb-3 pr-4">Mã đơn</th>
              <th className="pb-3 pr-4">Khách hàng</th>
              <th className="pb-3 pr-4">SĐT</th>
              <th className="pb-3 pr-4">Tổng tiền</th>
              <th className="pb-3 pr-4">{t("orderStatus")}</th>
              <th className="pb-3 pr-4">{t("paymentStatus")}</th>
              <th className="pb-3 pr-4">Thanh toán</th>
              <th className="pb-3 pr-4">Ngày đặt</th>
              <th className="pb-3"></th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-b">
                <td className="py-3 pr-4 font-mono text-xs">{o.orderCode}</td>
                <td className="py-3 pr-4">{o.customerName}</td>
                <td className="py-3 pr-4">{o.customerPhone}</td>
                <td className="py-3 pr-4">{formatVnd(o.totalVnd)}</td>
                <td className="py-3 pr-4">
                  <Badge variant="outline">{tOrderStatus(o.orderStatus as never)}</Badge>
                </td>
                <td className="py-3 pr-4">
                  <Badge variant="secondary">{tPaymentStatus(o.paymentStatus as never)}</Badge>
                </td>
                <td className="py-3 pr-4">{tPayment(o.paymentMethod as never)}</td>
                <td className="py-3 pr-4 text-muted-foreground text-xs">
                  {new Date(o.createdAt).toLocaleDateString("vi-VN")}
                </td>
                <td className="py-3">
                  <Link href={`/admin/orders/${o.id}`}>
                    <Button size="sm" variant="outline">{t("viewDetail")}</Button>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
