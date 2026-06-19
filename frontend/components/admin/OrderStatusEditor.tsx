"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { adminUpdateOrderStatus } from "@/features/admin/admin.api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import type { AdminOrderDetail } from "@/features/admin/admin.types";

const ORDER_STATUSES = ["PENDING_PAYMENT", "PAID", "PROCESSING", "SHIPPING", "DELIVERED", "CANCELLED"];
const PAYMENT_STATUSES = ["UNPAID", "PENDING", "PAID", "FAILED", "CANCELLED"];

interface Props {
  orderId: string;
  order: AdminOrderDetail;
  onUpdated: (order: AdminOrderDetail) => void;
}

export function OrderStatusEditor({ orderId, order, onUpdated }: Props) {
  const t = useTranslations("admin");
  const tOrderStatus = useTranslations("orderStatus");
  const tPaymentStatus = useTranslations("paymentStatus");

  const [orderStatus, setOrderStatus] = useState(order.orderStatus);
  const [paymentStatus, setPaymentStatus] = useState(order.paymentStatus);
  const [loading, setLoading] = useState(false);

  async function handleUpdate() {
    setLoading(true);
    try {
      const updated = await adminUpdateOrderStatus(orderId, { orderStatus, paymentStatus });
      onUpdated({ ...order, orderStatus: updated.orderStatus, paymentStatus: updated.paymentStatus });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Cập nhật trạng thái</CardTitle></CardHeader>
      <CardContent className="space-y-6">
        {/* Order status — visually separate from payment status */}
        <div className="space-y-2">
          <p className="text-sm font-medium">{t("orderStatus")}</p>
          <Select value={orderStatus} onValueChange={setOrderStatus}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {ORDER_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>{tOrderStatus(s as never)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Separator />

        {/* Payment status — visually separate */}
        <div className="space-y-2">
          <p className="text-sm font-medium">{t("paymentStatus")}</p>
          <Select value={paymentStatus} onValueChange={setPaymentStatus}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {PAYMENT_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>{tPaymentStatus(s as never)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button onClick={handleUpdate} disabled={loading}>
          {loading ? "Đang cập nhật..." : t("updateStatus")}
        </Button>
      </CardContent>
    </Card>
  );
}
