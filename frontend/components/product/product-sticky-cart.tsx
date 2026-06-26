"use client";

import { ShoppingCart } from "lucide-react";
import { Button } from "@/design-system/components/button";
import { cn } from "@/lib/utils";

interface ProductStickyCartProps {
  /** Shown when the inline buy box is scrolled off-screen. */
  visible: boolean;
  priceLabel: string;
  addLabel: string;
  onAddToCart: () => void;
  disabled?: boolean;
  isLoading?: boolean;
}

/**
 * Mobile (`<lg`) sticky add-to-cart bar. Sits above the bottom tab bar on phones
 * (`bottom = --bottom-nav-height`) and at the viewport bottom on tablets where the
 * tab bar is hidden (`md:bottom-0`). Hidden on desktop.
 */
export function ProductStickyCart({
  visible,
  priceLabel,
  addLabel,
  onAddToCart,
  disabled,
  isLoading,
}: ProductStickyCartProps) {
  return (
    <div
      aria-hidden={!visible}
      className={cn(
        "fixed inset-x-0 z-30 flex items-center gap-4 border-t border-border-default bg-surface px-4 py-3 shadow-md lg:hidden",
        "bottom-[calc(var(--bottom-nav-height)+env(safe-area-inset-bottom))] md:bottom-0 md:pb-safe-b",
        "transition-transform duration-200",
        visible ? "translate-y-0" : "pointer-events-none translate-y-full",
      )}
    >
      <p className="text-lg font-bold text-text-primary">{priceLabel}</p>
      <Button
        variant="primary"
        onClick={onAddToCart}
        disabled={disabled}
        isLoading={isLoading}
        tabIndex={visible ? undefined : -1}
        className="ml-auto h-11"
      >
        <ShoppingCart className="h-4 w-4" aria-hidden />
        {addLabel}
      </Button>
    </div>
  );
}
