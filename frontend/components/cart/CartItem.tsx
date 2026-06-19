"use client";

import { useTranslations } from "next-intl";
import { useCartStore } from "@/features/cart/cart.store";
import { cartItemKey } from "@/features/cart/cart.types";
import { formatVnd } from "@/lib/format-currency";
import { Button } from "@/components/ui/button";
import type { CartItem as CartItemType, HydratedCartItem } from "@/features/cart/cart.types";

interface Props {
  item: HydratedCartItem;
  cartItem: CartItemType;
}

export function CartItem({ item, cartItem }: Props) {
  const t = useTranslations("cart");
  const removeItem = useCartStore((s) => s.removeItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const key = cartItemKey(cartItem);

  return (
    <div className="flex gap-4 border rounded-lg p-4">
      <div className="w-20 h-20 bg-muted rounded shrink-0 overflow-hidden">
        {item.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">No img</div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm">{item.name}</p>
        <p className="text-xs text-muted-foreground">{item.sku}</p>
        <div className="text-xs text-muted-foreground mt-1 space-x-2">
          {item.selectedOptions.woodType && <span>{item.selectedOptions.woodType.label}</span>}
          {item.selectedOptions.finish && <span>· {item.selectedOptions.finish.label}</span>}
          {item.selectedOptions.size && <span>· {item.selectedOptions.size.label}</span>}
        </div>
        <div className="flex items-center gap-3 mt-2">
          <input
            type="number"
            min={1}
            value={cartItem.quantity}
            onChange={(e) => updateQuantity(key, Number(e.target.value))}
            className="w-16 border rounded px-2 py-1 text-sm"
          />
          <Button size="sm" variant="ghost" className="text-destructive" onClick={() => removeItem(key)}>
            {t("remove")}
          </Button>
        </div>
      </div>
      <div className="text-right shrink-0">
        <p className="font-bold text-primary">{formatVnd(item.lineTotalVnd)}</p>
        <p className="text-xs text-muted-foreground">{formatVnd(item.unitPriceVnd)} / sp</p>
      </div>
    </div>
  );
}
