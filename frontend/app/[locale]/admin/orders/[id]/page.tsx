"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { adminGetOrder } from "@/features/admin/admin.api";
import { OrderStatusEditor } from "@/components/admin/OrderStatusEditor";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatVnd } from "@/lib/format-currency";
import type { AdminOrderDetail } from "@/features/admin/admin.types";

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const t = useTranslations("admin");
  const [order, setOrder] = useState<AdminOrderDetail | null>(null);
  const [orderId, setOrderId] = useState("");

  useEffect(() => {
    params.then(({ id }) => {
      setOrderId(id);
      adminGetOrder(id).then(setOrder).catch(console.error);
    });
  }, [params]);

  if (!order) return <p className="text-muted-foreground p-6">Đang tải...</p>;

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-xl font-bold">{t("orderDetail")}: {order.orderCode}</h1>

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
    </div>
  );
}
