"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { adminGetOrder, adminConfirmManualPayment } from "@/features/admin/admin.api";
import { OrderStatusEditor } from "@/components/admin/OrderStatusEditor";
import { PaymentTransactionTable } from "@/components/admin/PaymentTransactionTable";
import { OrderTimeline } from "@/components/admin/OrderTimeline";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { formatVnd } from "@/lib/format-currency";
import type { AdminOrderDetail } from "@/features/admin/admin.types";

export default function OrderDetailPage({ params }: { params: { id: string } }) {
  const t = useTranslations("admin");
  const [order, setOrder] = useState<AdminOrderDetail | null>(null);
  const [confirming, setConfirming] = useState(false);
  const { id: orderId } = params;

  useEffect(() => {
    adminGetOrder(orderId).then(setOrder).catch(console.error);
  }, [orderId]);

  async function handleConfirmManualPayment() {
    if (!order) return;
    const note = prompt("Ghi chú (tùy chọn):");
    setConfirming(true);
    try {
      await adminConfirmManualPayment(orderId, note ?? undefined);
      const updated = await adminGetOrder(orderId);
      setOrder(updated);
    } catch (e: unknown) {
      alert((e as Error).message ?? "Xác nhận thất bại");
    } finally {
      setConfirming(false);
    }
  }

  if (!order) return <p className="text-muted-foreground p-6">Đang tải...</p>;

  const canConfirmManual = order.paymentMethod === "BANK_TRANSFER" && order.paymentStatus !== "PAID";

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">{t("orderDetail")}: {order.orderCode}</h1>
        {canConfirmManual && (
          <Button size="sm" onClick={handleConfirmManualPayment} disabled={confirming}>
            {confirming ? "Đang xác nhận..." : "Xác nhận đã thanh toán"}
          </Button>
        )}
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">{t("customerInfo")}</CardTitle></CardHeader>
        <CardContent className="text-sm space-y-1">
          <p><span className="text-muted-foreground">Tên: </span>{order.customerName}</p>
          <p><span className="text-muted-foreground">SĐT: </span>{order.customerPhone}</p>
          {order.customerEmail && <p><span className="text-muted-foreground">Email: </span>{order.customerEmail}</p>}
          <p><span className="text-muted-foreground">{t("shippingAddress")}: </span>{order.shippingAddress}</p>
          {order.note && <p><span className="text-muted-foreground">Ghi chú: </span>{order.note}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">{t("orderItems")}</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {order.items.map((item, i) => (
            <div key={i} className="text-sm">
              <div className="flex justify-between">
                <span className="font-medium">{item.productNameSnapshot}</span>
                <span>{formatVnd(item.lineTotalVnd)}</span>
              </div>
              <p className="text-muted-foreground text-xs">{item.productSkuSnapshot} × {item.quantity}</p>
              <div className="text-xs text-muted-foreground mt-1">
                {Object.entries(item.selectedOptionsSnapshot).map(([k, v]) => (
                  <span key={k} className="mr-3">{k}: {String((v as Record<string, unknown>).label ?? v)}</span>
                ))}
              </div>
            </div>
          ))}
          <Separator />
          <div className="flex justify-between font-semibold">
            <span>Tổng</span>
            <span>{formatVnd(order.totalVnd)}</span>
          </div>
        </CardContent>
      </Card>

      <OrderStatusEditor orderId={orderId} order={order} onUpdated={setOrder} />

      {order.paymentTransactions?.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Giao dịch thanh toán</CardTitle></CardHeader>
          <CardContent>
            <PaymentTransactionTable transactions={order.paymentTransactions} />
          </CardContent>
        </Card>
      )}

      {order.orderEvents?.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Lịch sử đơn hàng</CardTitle></CardHeader>
          <CardContent>
            <OrderTimeline events={order.orderEvents} />
          </CardContent>
        </Card>
      )}

      {order.emailLogs?.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Email đã gửi</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {order.emailLogs.map((log) => (
              <div key={log.id} className="text-sm flex justify-between">
                <div>
                  <p className="font-medium">{log.subject}</p>
                  <p className="text-xs text-muted-foreground">{log.recipientEmail} · {log.templateKey}</p>
                </div>
                <span className={`text-xs ${log.status === "SENT" ? "text-green-600" : "text-red-500"}`}>{log.status}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
