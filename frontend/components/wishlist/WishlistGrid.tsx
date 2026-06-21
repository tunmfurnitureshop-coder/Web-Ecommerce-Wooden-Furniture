"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Heart } from "lucide-react";
import { useCustomerAuth } from "@/components/customer/CustomerAuthContext";
import { useWishlistStore } from "@/features/wishlist/wishlist.store";
import { WishlistItemCard } from "./WishlistItemCard";
import type { WishlistItem } from "@/features/wishlist/wishlist.types";

export function WishlistGrid() {
  const t = useTranslations("wishlist");
  const tCommon = useTranslations("common");
  const { customerFetch } = useCustomerAuth();
  const { remove } = useWishlistStore();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    customerFetch<{ items: WishlistItem[]; total: number }>("/api/v1/customer/wishlist")
      .then((data) => setItems(data.items))
      .catch(() => setError(tCommon("error")))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleRemove(productId: string) {
    try {
      await customerFetch(`/api/v1/customer/wishlist/items/${productId}`, { method: "DELETE" });
      setItems((prev) => prev.filter((i) => i.productId !== productId));
      remove(productId);
    } catch {
      setError(tCommon("error"));
    }
  }

  if (loading) return <p className="text-muted-foreground">{tCommon("loading")}</p>;
  if (error) return <p className="text-destructive">{error}</p>;

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
        <Heart className="h-12 w-12 text-muted-foreground/30" />
        <p className="text-muted-foreground">{t("empty")}</p>
        <p className="text-sm text-muted-foreground">{t("emptyHint")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <WishlistItemCard key={item.productId} item={item} onRemove={handleRemove} />
      ))}
    </div>
  );
}
