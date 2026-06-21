"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useCustomerAuth } from "@/components/customer/CustomerAuthContext";
import { OrderCard } from "@/components/customer/OrderCard";
import type { CustomerOrderListResponse } from "@/features/customer/customer.types";
import { Button } from "@/components/ui/button";

export default function OrdersPage() {
  const t = useTranslations("account.orders");
  const tCommon = useTranslations("common");
  const { customerFetch } = useCustomerAuth();
  const [data, setData] = useState<CustomerOrderListResponse | null>(null);
  const [page, setPage] = useState(1);
  const [error, setError] = useState("");

  useEffect(() => {
    setData(null);
    customerFetch<CustomerOrderListResponse>(
      `/api/v1/customer/orders?page=${page}&pageSize=10`
    )
      .then(setData)
      .catch(() => setError(tCommon("error")));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  if (error) return <p className="text-destructive">{error}</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">{t("title")}</h1>
      {!data && <p className="text-muted-foreground">{tCommon("loading")}</p>}
      {data && data.items.length === 0 && (
        <p className="text-muted-foreground">{t("empty")}</p>
      )}
      {data && (
        <>
          <div className="space-y-3">
            {data.items.map((order) => (
              <OrderCard key={order.orderCode} order={order} />
            ))}
          </div>
          {data.total > 10 && (
            <div className="flex items-center gap-2 text-sm">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
              >
                {tCommon("previous")}
              </Button>
              <span className="text-muted-foreground">
                {tCommon("page")} {page} {tCommon("of")} {Math.ceil(data.total / 10)}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page * 10 >= data.total}
                onClick={() => setPage((p) => p + 1)}
              >
                {tCommon("next")}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
