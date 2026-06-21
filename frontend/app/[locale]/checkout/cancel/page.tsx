"use client";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { retryPayment } from "@/features/checkout/checkout.api";
import { Link } from "@/i18n/navigation";
import { Container } from "@/design-system/primitives/container";
import { EmptyState } from "@/design-system/components/empty-state";
import { Button } from "@/design-system/components/button";
import { XCircle } from "lucide-react";

export default function CheckoutCancelPage() {
  const t = useTranslations("checkout");
  const tCart = useTranslations("cart");
  const searchParams = useSearchParams();
  const orderCode =
    searchParams.get("orderCode") ??
    (typeof window !== "undefined" ? sessionStorage.getItem("pendingOrderCode") : null);
  const [retrying, setRetrying] = useState(false);

  async function handleRetry() {
    if (!orderCode) return;
    setRetrying(true);
    try {
      const res = await retryPayment(orderCode);
      window.location.href = res.checkoutUrl;
    } catch {
      setRetrying(false);
    }
  }

  return (
    <Container className="py-16">
      <EmptyState
        icon={<XCircle className="h-14 w-14 text-danger" />}
        title={t("cancelTitle")}
        description={orderCode ? `${t("orderCode")}: ${orderCode}` : t("cancelDesc")}
        action={
          <div className="flex gap-3 justify-center flex-wrap">
            <Link href="/cart">
              <Button variant="outline">{t("viewCart")}</Button>
            </Link>
            {orderCode && (
              <Button variant="primary" onClick={handleRetry} isLoading={retrying}>
                {t("retryPayment")}
              </Button>
            )}
          </div>
        }
      />
      <div className="text-center mt-4">
        <Link
          href="/products"
          className="text-sm text-text-muted hover:text-text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus rounded-sm"
        >
          {tCart("continueShopping")}
        </Link>
      </div>
    </Container>
  );
}
