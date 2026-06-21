"use client";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useCustomerAuth } from "@/components/customer/CustomerAuthContext";
import { OrderDetailTimeline } from "@/components/customer/OrderDetailTimeline";
import { ReorderButton } from "@/components/customer/ReorderButton";
import { ErrorState } from "@/design-system/components/error-state";
import { Skeleton } from "@/design-system/components/skeleton";
import { StatusBadge } from "@/design-system/components/status-badge";
import { Divider } from "@/design-system/primitives/divider";
import { Link } from "@/i18n/navigation";
import { formatCurrency } from "@/lib/format-currency";
import { ChevronLeft } from "lucide-react";
import type { CustomerOrderDetail } from "@/features/customer/customer.types";

interface Props {
  params: Promise<{ orderCode: string }>;
}

export default function OrderDetailPage({ params }: Props) {
  const t = useTranslations("account.orders.detail");
  const tCommon = useTranslations("common");
  const { customerFetch } = useCustomerAuth();
  const [order, setOrder] = useState<CustomerOrderDetail | null>(null);
  const [orderCode, setOrderCode] = useState("");
  const [error, setError] = useState(false);

  function load(code: string) {
    setError(false);
    customerFetch<CustomerOrderDetail>(`/api/v1/customer/orders/${code}`)
      .then(setOrder)
      .catch(() => setError(true));
  }

  useEffect(() => {
    params.then(({ orderCode: code }) => {
      setOrderCode(code);
      load(code);
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (error) return <ErrorState onRetry={() => orderCode && load(orderCode)} />;

  if (!order) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <Link
          href="/account/orders"
          className="flex items-center gap-1 text-sm text-text-muted hover:text-text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus rounded-sm"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
          {tCommon("back")}
        </Link>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <h1 className="text-xl font-semibold text-text-primary">{t("title")}</h1>
        <span className="font-mono text-sm text-text-secondary">{order.orderCode}</span>
        <StatusBadge status={order.orderStatus as never} type="order" />
      </div>

      <div className="rounded-xl border border-border-default bg-surface p-4 flex flex-col gap-3 text-sm">
        <div>
          <p className="font-medium text-text-primary">{order.customerName} · {order.customerPhone}</p>
          <p className="text-text-secondary mt-0.5">{order.shippingAddress}</p>
          {order.note && <p className="text-text-muted mt-0.5">{order.note}</p>}
        </div>
        <Divider />
        <div className="flex flex-col gap-2">
          {order.items.map((item, idx) => (
            <div key={idx} className="flex justify-between">
              <div>
                <p className="text-text-primary">{item.productNameSnapshot}</p>
                <p className="text-xs text-text-muted">{item.productSkuSnapshot} × {item.quantity}</p>
              </div>
              <p className="font-medium text-text-primary">{formatCurrency(item.lineTotalVnd)}</p>
            </div>
          ))}
        </div>
        <Divider />
        <div className="flex flex-col gap-1">
          <div className="flex justify-between text-text-secondary">
            <span>Tạm tính</span>
            <span>{formatCurrency(order.subtotalVnd)}</span>
          </div>
          <div className="flex justify-between text-text-secondary">
            <span>Phí ship</span>
            <span>{formatCurrency(order.shippingFeeVnd)}</span>
          </div>
          <div className="flex justify-between font-semibold text-text-primary pt-1">
            <span>Tổng</span>
            <span>{formatCurrency(order.totalVnd)}</span>
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
