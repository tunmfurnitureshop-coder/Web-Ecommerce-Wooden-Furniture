"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/lib/i18n";
import { Inbox } from "lucide-react";
import { adminListOrders } from "@/features/admin/admin.api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageState } from "@/design-system/components/page-state";
import { usePageData } from "@/design-system/hooks/use-page-data";
import { formatVnd } from "@/lib/format-currency";

export default function AdminOrdersPage() {
  const t = useTranslations("admin");
  const tc = useTranslations("common");
  const tOrderStatus = useTranslations("orderStatus");
  const tPaymentStatus = useTranslations("paymentStatus");
  const tPayment = useTranslations("payment");
  const { status, data, reload } = usePageData(() => adminListOrders());
  const orders = data?.items ?? [];

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold text-text-primary">{t("orders")}</h1>
      <PageState
        status={status}
        isEmpty={orders.length === 0}
        onRetry={reload}
        errorTitle={t("loadErrorTitle")}
        retryLabel={tc("retry")}
        emptyIcon={<Inbox className="h-10 w-10" />}
        emptyTitle={t("noOrders")}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-default text-left text-text-muted">
                <th className="pb-3 pr-4">{t("orderCode")}</th>
                <th className="pb-3 pr-4">{t("customerName")}</th>
                <th className="pb-3 pr-4">{t("customerPhone")}</th>
                <th className="pb-3 pr-4">{t("totalAmount")}</th>
                <th className="pb-3 pr-4">{t("orderStatus")}</th>
                <th className="pb-3 pr-4">{t("paymentStatus")}</th>
                <th className="pb-3 pr-4">{t("paymentMethod")}</th>
                <th className="pb-3 pr-4">{t("orderDate")}</th>
                <th className="pb-3"></th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-b border-border-default">
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
                  <td className="py-3 pr-4 text-xs text-text-muted">
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
      </PageState>
    </div>
  );
}
