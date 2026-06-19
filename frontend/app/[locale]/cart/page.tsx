"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/lib/i18n";
import { useCartStore } from "@/features/cart/cart.store";
import { hydrateCart } from "@/features/cart/cart.api";
import { CartItem } from "@/components/cart/CartItem";
import { CartSummary } from "@/components/cart/CartSummary";
import { Button } from "@/components/ui/button";
import type { CartHydrateResponse } from "@/features/cart/cart.types";

export default function CartPage() {
  const t = useTranslations("cart");
  const items = useCartStore((s) => s.items);
  const [hydrated, setHydrated] = useState<CartHydrateResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (items.length === 0) {
      setHydrated(null);
      return;
    }
    setLoading(true);
    hydrateCart({ locale: "vi", items })
      .then(setHydrated)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [items]);

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-20 text-center">
        <h1 className="text-2xl font-bold mb-4">{t("title")}</h1>
        <p className="text-muted-foreground mb-8">{t("emptyDesc")}</p>
        <Link href="/products">
          <Button>{t("continueShopping")}</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold mb-8">{t("title")}</h1>
      {loading ? (
        <p className="text-muted-foreground">Đang tải...</p>
      ) : (
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1 space-y-4">
            {hydrated?.items.map((item, i) => (
              <CartItem key={i} item={item} cartItem={items[i]} />
            ))}
          </div>
          {hydrated && <CartSummary hydrated={hydrated} />}
        </div>
      )}
    </div>
  );
}
