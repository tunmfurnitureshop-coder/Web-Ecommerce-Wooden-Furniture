import { getTranslations } from "next-intl/server";
import { Link } from "@/lib/i18n";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatVnd } from "@/lib/format-currency";
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
  const tOrderStatus = await getTranslations("orderStatus");
  const tPaymentStatus = await getTranslations("paymentStatus");
  const order = sp.orderCode ? await getOrder(sp.orderCode) : null;

  if (!order) {
    return (
      <div className="max-w-lg mx-auto px-6 py-20 text-center">
        <p className="text-muted-foreground">Không tìm thấy đơn hàng.</p>
        <Link href="/products" className="mt-4 inline-block">
          <Button>{t("backToShop")}</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">{t("title")}</h1>
        <p className="text-muted-foreground">{t("subtitle")}</p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">{t("orderCode")}: {order.orderCode}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t("orderStatus")}</span>
            <span className="font-medium">{tOrderStatus(order.orderStatus as never)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t("paymentStatus")}</span>
            <span className="font-medium">{tPaymentStatus(order.paymentStatus as never)}</span>
          </div>
          <div className="flex justify-between font-semibold pt-2 border-t">
            <span>{t("total")}</span>
            <span className="text-primary">{formatVnd(order.totalVnd)}</span>
          </div>
        </CardContent>
      </Card>

      {order.items.length > 0 && (
        <Card className="mb-8">
          <CardHeader><CardTitle className="text-base">{t("items")}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {order.items.map((item, i) => (
              <div key={i} className="flex justify-between text-sm">
                <div>
                  <p className="font-medium">{item.productNameSnapshot}</p>
                  <p className="text-muted-foreground text-xs">{item.productSkuSnapshot} × {item.quantity}</p>
                </div>
                <p className="font-medium">{formatVnd(item.lineTotalVnd)}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="text-center">
        <Link href="/products">
          <Button>{t("backToShop")}</Button>
        </Link>
      </div>
    </div>
  );
}
