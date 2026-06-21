"use client";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useCustomerAuth } from "@/components/customer/CustomerAuthContext";
import { OrderCard } from "@/components/customer/OrderCard";
import { ErrorState } from "@/design-system/components/error-state";
import { EmptyState } from "@/design-system/components/empty-state";
import { Skeleton } from "@/design-system/components/skeleton";
import { Button } from "@/design-system/components/button";
import { Package } from "lucide-react";
import type { CustomerOrderListResponse } from "@/features/customer/customer.types";

export default function OrdersPage() {
  const t = useTranslations("account.orders");
  const tCommon = useTranslations("common");
  const { customerFetch } = useCustomerAuth();
  const [data, setData] = useState<CustomerOrderListResponse | null>(null);
  const [page, setPage] = useState(1);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  function load(p: number) {
    setLoading(true);
    setError(false);
    setData(null);
    customerFetch<CustomerOrderListResponse>(`/api/v1/customer/orders?page=${p}&pageSize=10`)
      .then(setData)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(page); }, [page]); // eslint-disable-line react-hooks/exhaustive-deps

  if (error) return <ErrorState onRetry={() => load(page)} />;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-text-primary">{t("title")}</h1>

      {loading && (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-lg border border-border-default p-4 flex flex-col gap-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48" />
              <Skeleton className="h-3 w-24" />
            </div>
          ))}
        </div>
      )}

      {!loading && data?.items.length === 0 && (
        <EmptyState icon={<Package className="h-12 w-12" />} title={t("empty")} />
      )}

      {!loading && data && data.items.length > 0 && (
        <>
          <div className="flex flex-col gap-3">
            {data.items.map((order) => (
              <OrderCard key={order.orderCode} order={order} />
            ))}
          </div>
          {data.total > 10 && (
            <div className="flex items-center gap-2 text-sm">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
                {tCommon("previous")}
              </Button>
              <span className="text-text-muted">
                {tCommon("page")} {page} {tCommon("of")} {Math.ceil(data.total / 10)}
              </span>
              <Button variant="outline" size="sm" disabled={page * 10 >= data.total} onClick={() => setPage((p) => p + 1)}>
                {tCommon("next")}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
