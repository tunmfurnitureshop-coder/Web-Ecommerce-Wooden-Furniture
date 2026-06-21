"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { getOrderPaymentStatus, retryPayment } from "@/features/checkout/checkout.api";
import type { OrderPaymentStatus } from "@/features/checkout/checkout.types";
import { Container } from "@/design-system/primitives/container";
import { EmptyState } from "@/design-system/components/empty-state";
import { Button } from "@/design-system/components/button";
import { Skeleton } from "@/design-system/components/skeleton";
import { CheckCircle2, Clock, XCircle, AlertCircle } from "lucide-react";

type State = "loading" | "paid" | "pending" | "failed" | "error";

export default function CheckoutReturnPage() {
  const t = useTranslations("checkout");
  const tCart = useTranslations("cart");
  const searchParams = useSearchParams();
  const router = useRouter();
  const [state, setState] = useState<State>("loading");
  const [order, setOrder] = useState<OrderPaymentStatus | null>(null);
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    const code =
      searchParams.get("orderCode") ??
      (typeof window !== "undefined" ? sessionStorage.getItem("pendingOrderCode") : null);
    if (!code) { setState("error"); return; }
    getOrderPaymentStatus(code)
      .then((data) => {
        setOrder(data);
        if (data.paymentStatus === "PAID") setState("paid");
        else if (data.paymentStatus === "FAILED" || data.paymentStatus === "CANCELLED") setState("failed");
        else setState("pending");
      })
      .catch(() => setState("error"));
  }, [searchParams]);

  async function handleRetry() {
    if (!order) return;
    setRetrying(true);
    try {
      const res = await retryPayment(order.orderCode);
      window.location.href = res.checkoutUrl;
    } catch {
      setRetrying(false);
    }
  }

  if (state === "loading") {
    return (
      <Container className="py-16 max-w-lg">
        <div className="flex flex-col items-center gap-4">
          <Skeleton className="h-14 w-14 rounded-full" />
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
      </Container>
    );
  }

  if (state === "error") {
    return (
      <Container className="py-16 max-w-lg">
        <EmptyState
          icon={<AlertCircle className="h-14 w-14 text-danger" />}
          title={t("returnNotFound")}
          action={
            <Button variant="primary" onClick={() => router.push("/products")}>
              {tCart("continueShopping")}
            </Button>
          }
        />
      </Container>
    );
  }

  return (
    <Container className="py-16 max-w-lg">
      {state === "paid" && (
        <EmptyState
          icon={<CheckCircle2 className="h-14 w-14 text-success" />}
          title={t("returnPaidTitle")}
          description={order ? `${t("orderCode")}: ${order.orderCode}` : t("returnPaidDesc")}
          action={
            <Button
              variant="primary"
              onClick={() => router.push(`/success?orderCode=${order?.orderCode}`)}
            >
              {t("viewOrderDetail")}
            </Button>
          }
        />
      )}

      {state === "pending" && (
        <EmptyState
          icon={<Clock className="h-14 w-14 text-warning" />}
          title={t("returnPendingTitle")}
          description={order ? `${t("orderCode")}: ${order.orderCode}` : t("returnPendingDesc")}
          action={
            <div className="flex gap-3 justify-center flex-wrap">
              <Button variant="outline" onClick={() => router.refresh()}>
                {t("checkStatus")}
              </Button>
              <Button variant="primary" onClick={handleRetry} isLoading={retrying}>
                {t("retryPayment")}
              </Button>
            </div>
          }
        />
      )}

      {state === "failed" && (
        <EmptyState
          icon={<XCircle className="h-14 w-14 text-danger" />}
          title={t("returnFailedTitle")}
          description={order ? `${t("orderCode")}: ${order.orderCode}` : t("returnFailedDesc")}
          action={
            <Button variant="primary" onClick={handleRetry} isLoading={retrying}>
              {t("retryPayment")}
            </Button>
          }
        />
      )}
    </Container>
  );
}
