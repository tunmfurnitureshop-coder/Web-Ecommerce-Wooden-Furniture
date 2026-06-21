"use client";

import { useTranslations } from "next-intl";
import { Trash2 } from "lucide-react";
import { Link } from "@/lib/i18n";
import { formatVnd } from "@/lib/format-currency";
import { Button } from "@/components/ui/button";
import type { WishlistItem } from "@/features/wishlist/wishlist.types";

interface WishlistItemCardProps {
  item: WishlistItem;
  onRemove: (productId: string) => void;
}

export function WishlistItemCard({ item, onRemove }: WishlistItemCardProps) {
  const t = useTranslations("wishlist");

  return (
    <div className="flex gap-4 p-4 bg-card rounded-lg border">
      <Link href={`/products/${item.slug}`} className="shrink-0">
        <div className="w-20 h-20 bg-muted rounded overflow-hidden">
          {item.primaryImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.primaryImageUrl}
              alt={item.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
              No image
            </div>
          )}
        </div>
      </Link>

      <div className="flex-1 min-w-0">
        <Link href={`/products/${item.slug}`}>
          <h3 className="font-medium text-sm line-clamp-2 hover:text-primary transition-colors">
            {item.name}
          </h3>
        </Link>
        <p className="font-bold text-primary mt-1 text-sm">{formatVnd(item.basePriceVnd)}</p>
      </div>

      <div className="flex flex-col items-end gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-destructive"
          onClick={() => onRemove(item.productId)}
          aria-label={t("remove")}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
        <Link href={`/products/${item.slug}`}>
          <Button size="sm" variant="outline" className="text-xs">
            {t("viewProduct")}
          </Button>
        </Link>
      </div>
    </div>
  );
}
