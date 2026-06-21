import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { api } from "@/lib/api";
import { Container } from "@/design-system/primitives/container";
import { Button } from "@/design-system/components/button";
import { Divider } from "@/design-system/primitives/divider";
import { StatusBadge } from "@/design-system/components/status-badge";
import { formatCurrency } from "@/lib/format-currency";
import { CheckCircle2 } from "lucide-react";
import type { OrderSummary } from "@/features/checkout/checkout.types";

async function getOrder(orderCode: string) {
  try {
    return await api.get<OrderSummary>(`/api/v1/orders/${orderCode}`);
  } catch {
    return null;
  }
}

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ orderCode?: string }>;
}) {
  const sp = await searchParams;
  const t = await getTranslations("success");
  const order = sp.orderCode ? await getOrder(sp.orderCode) : null;

  if (!order) {
    return (
      <Container className="py-20 text-center">
        <p className="text-text-muted">{t("notFound")}</p>
        <Link href="/products" className="mt-4 inline-block">
          <Button variant="primary">{t("backToShop")}</Button>
        </Link>
      </Container>
    );
  }

  return (
    <Container className="py-12 pb-16 max-w-2xl">
      <div className="text-center mb-8 flex flex-col items-center gap-3">
        <CheckCircle2 className="h-16 w-16 text-success" aria-hidden />
        <h1 className="text-3xl font-bold font-display text-text-primary">{t("title")}</h1>
        <p className="text-text-secondary">{t("subtitle")}</p>
      </div>

      <div className="rounded-xl border border-border-default bg-surface p-5 flex flex-col gap-4 mb-6">
        <div className="flex items-center justify-between">
          <span className="text-sm text-text-muted">{t("orderCode")}</span>
          <span className="font-mono font-semibold text-text-primary">{order.orderCode}</span>
        </div>
        <Divider />
        <div className="flex items-center justify-between">
          <span className="text-sm text-text-muted">{t("orderStatus")}</span>
          <StatusBadge status={order.orderStatus as never} type="order" />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-text-muted">{t("paymentStatus")}</span>
          <StatusBadge status={order.paymentStatus as never} type="payment" />
        </div>
        <Divider />
        <div className="flex items-center justify-between font-semibold text-text-primary">
          <span>{t("total")}</span>
          <span className="text-lg">{formatCurrency(order.totalVnd)}</span>
        </div>
      </div>

      {order.items.length > 0 && (
        <div className="rounded-xl border border-border-default bg-surface p-5 flex flex-col gap-3 mb-8">
          <h2 className="text-sm font-semibold text-text-primary">{t("items")}</h2>
          <Divider />
          {order.items.map((item, i) => (
            <div key={i} className="flex justify-between text-sm">
              <div>
                <p className="font-medium text-text-primary">{item.productNameSnapshot}</p>
                <p className="text-text-muted text-xs">{item.productSkuSnapshot} × {item.quantity}</p>
              </div>
              <p className="font-medium text-text-primary">{formatCurrency(item.lineTotalVnd)}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-3 justify-center">
        <Link href="/account/orders">
          <Button variant="outline">{t("viewOrders")}</Button>
        </Link>
        <Link href="/products">
          <Button variant="primary">{t("backToShop")}</Button>
        </Link>
      </div>
    </Container>
  );
}
