"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Heart } from "lucide-react";
import { useRouter } from "@/lib/i18n";
import { useCustomerAuth } from "@/components/customer/CustomerAuthContext";
import { useWishlistStore } from "@/features/wishlist/wishlist.store";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface WishlistButtonProps {
  productId: string;
  className?: string;
}

export function WishlistButton({ productId, className }: WishlistButtonProps) {
  const t = useTranslations("wishlist");
  const router = useRouter();
  const { isAuthenticated, customerFetch } = useCustomerAuth();
  const { ids, loaded, load, add, remove } = useWishlistStore();
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (isAuthenticated && !loaded) {
      load(customerFetch);
    }
  }, [isAuthenticated, loaded, load, customerFetch]);

  const isSaved = ids.has(productId);

  async function handleToggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    setPending(true);
    try {
      if (isSaved) {
        await customerFetch(`/api/v1/customer/wishlist/items/${productId}`, {
          method: "DELETE",
        });
        remove(productId);
      } else {
        await customerFetch<void>("/api/v1/customer/wishlist/items", {
          method: "POST",
          body: JSON.stringify({ productId }),
        });
        add(productId);
      }
    } catch {
      // silently fail — UI stays consistent
    } finally {
      setPending(false);
    }
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={cn(
        "h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background/90 shadow-sm",
        className
      )}
      onClick={handleToggle}
      disabled={pending}
      aria-label={isSaved ? t("remove") : t("add")}
    >
      <Heart
        className={cn(
          "h-4 w-4 transition-colors",
          isSaved ? "fill-red-500 stroke-red-500" : "stroke-muted-foreground"
        )}
      />
    </Button>
  );
}
