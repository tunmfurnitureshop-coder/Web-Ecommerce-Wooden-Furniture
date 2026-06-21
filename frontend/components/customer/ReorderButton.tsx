"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/lib/i18n";
import { useCustomerAuth } from "./CustomerAuthContext";
import { useCartStore } from "@/features/cart/cart.store";
import type { ReorderResponse } from "@/features/customer/customer.types";
import { Button } from "@/components/ui/button";

interface Props {
  orderCode: string;
}

export function ReorderButton({ orderCode }: Props) {
  const t = useTranslations("account.orders.detail");
  const { customerFetch } = useCustomerAuth();
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleReorder() {
    setLoading(true);
    setError("");
    try {
      const res = await customerFetch<ReorderResponse>(
        `/api/v1/customer/orders/${orderCode}/reorder`,
        { method: "POST" }
      );
      for (const item of res.items) {
        addItem({
          productId: item.productId,
          quantity: item.quantity,
          selectedOptions: item.selectedOptions,
        });
      }
      router.push("/cart");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("reorderError"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-1">
      <Button onClick={handleReorder} disabled={loading}>
        {loading ? t("reordering") : t("reorder")}
      </Button>
      {error && <p className="text-destructive text-xs">{error}</p>}
    </div>
  );
}
