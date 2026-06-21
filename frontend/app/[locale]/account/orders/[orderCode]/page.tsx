"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useCustomerAuth } from "@/components/customer/CustomerAuthContext";
import { OrderDetailTimeline } from "@/components/customer/OrderDetailTimeline";
import { ReorderButton } from "@/components/customer/ReorderButton";
import type { CustomerOrderDetail } from "@/features/customer/customer.types";
import { formatVnd } from "@/lib/format-currency";
import { Badge } from "@/components/ui/badge";
import { Link } from "@/lib/i18n";

interface Props {
  params: Promise<{ orderCode: string }>;
}

export default function OrderDetailPage({ params }: Props) {
  const t = useTranslations("account.orders.detail");
  const tCommon = useTranslations("common");
  const tStatus = useTranslations("orderStatus");
  const { customerFetch } = useCustomerAuth();
  const [order, setOrder] = useState<CustomerOrderDetail | null>(null);
  const [orderCode, setOrderCode] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    params.then(({ orderCode: code }) => {
      setOrderCode(code);
      return customerFetch<CustomerOrderDetail>(`/api/v1/customer/orders/${code}`);
    })
      .then(setOrder)
      .catch(() => setError(tCommon("error")));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error) return <p className="text-destructive">{error}</p>;
  if (!order) return <p className="text-muted-foreground">{tCommon("loading")}</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/account/orders" className="text-sm text-muted-foreground hover:text-foreground">
          ← {tCommon("back")}
        </Link>
        <h1 className="text-xl font-semibold">{t("title")}</h1>
      </div>

      <div className="flex items-center gap-3">
        <span className="font-mono font-semibold">{order.orderCode}</span>
        <Badge variant="secondary">
          {tStatus(order.orderStatus as Parameters<typeof tStatus>[0])}
        </Badge>
      </div>

      <div className="grid gap-4 text-sm">
        <div>
          <p className="font-medium">{order.customerName} · {order.customerPhone}</p>
          <p className="text-muted-foreground">{order.shippingAddress}</p>
          {order.note && <p className="text-muted-foreground">{order.note}</p>}
        </div>

        <div className="space-y-2 border-t pt-4">
          {order.items.map((item, idx) => (
            <div key={idx} className="flex justify-between">
              <div>
                <p>{item.productNameSnapshot}</p>
                <p className="text-xs text-muted-foreground">{item.productSkuSnapshot} × {item.quantity}</p>
              </div>
              <p>{formatVnd(item.lineTotalVnd)}</p>
            </div>
          ))}
        </div>

        <div className="border-t pt-3 space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Tạm tính</span>
            <span>{formatVnd(order.subtotalVnd)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Phí ship</span>
            <span>{formatVnd(order.shippingFeeVnd)}</span>
          </div>
          <div className="flex justify-between font-semibold">
            <span>Tổng</span>
            <span>{formatVnd(order.totalVnd)}</span>
          </div>
        </div>
      </div>

      {order.orderStatus === "DELIVERED" && orderCode && (
        <ReorderButton orderCode={orderCode} />
      )}

      {order.events.length > 0 && <OrderDetailTimeline events={order.events} />}
    </div>
  );
}
