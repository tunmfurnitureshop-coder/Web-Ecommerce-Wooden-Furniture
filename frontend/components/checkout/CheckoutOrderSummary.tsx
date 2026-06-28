"use client";
import { useEffect, useState, useId } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { ChevronDown } from "lucide-react";
import { useCartStore } from "@/features/cart/cart.store";
import { hydrateCart } from "@/features/cart/cart.api";
import type { CartHydrateResponse } from "@/features/cart/cart.types";
import { Skeleton } from "@/design-system/components/skeleton";
import { Divider } from "@/design-system/primitives/divider";
import { formatCurrency } from "@/lib/format-currency";
import { cn } from "@/lib/utils";

export function CheckoutOrderSummary({ className }: { className?: string }) {
  const t = useTranslations("checkout");
  const tCart = useTranslations("cart");
  const { items } = useCartStore();
  const [hydrated, setHydrated] = useState<CartHydrateResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false); // mobile accordion — collapsed by default
  const bodyId = useId();

  useEffect(() => {
    if (items.length === 0) { setHydrated(null); return; }
    setLoading(true);
    hydrateCart({ locale: "vi", items })
      .then(setHydrated)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [items]);

  if (items.length === 0) return null;

  return (
    <div className={cn("rounded-xl border border-border-default bg-surface flex flex-col h-fit lg:sticky lg:top-24", className)}>
      {/* Mobile: collapsible toggle (shows total + chevron). Desktop: static heading
          — separate elements so aria-expanded never lies and there's no phantom
          focus stop on desktop (where the body is always visible). */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={bodyId}
        className="flex items-center justify-between gap-3 p-5 text-left lg:hidden"
      >
        <span className="text-base font-semibold text-text-primary">{t("orderSummary")}</span>
        <span className="flex items-center gap-2">
          {hydrated && (
            <span className="text-base font-bold text-text-primary">{formatCurrency(hydrated.totalVnd)}</span>
          )}
          <ChevronDown className={cn("h-5 w-5 shrink-0 text-text-muted transition-transform", open && "rotate-180")} aria-hidden />
        </span>
      </button>
      <h2 className="hidden px-5 pt-5 text-base font-semibold text-text-primary lg:block">{t("orderSummary")}</h2>

      <div id={bodyId} className={cn("flex-col gap-4 px-5 pb-5", open ? "flex" : "hidden", "lg:flex")}>
        <Divider />

      {loading ? (
        <div className="flex flex-col gap-3">
          {items.map((_, i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="h-16 w-16 rounded-md shrink-0" />
              <div className="flex-1 flex flex-col gap-1.5">
                <Skeleton className="h-3 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <Skeleton className="h-3 w-14" />
            </div>
          ))}
        </div>
      ) : hydrated ? (
        <div className="flex flex-col gap-3">
          {hydrated.items.map((item) => (
            <div key={item.sku} className="flex gap-3 items-start">
              <div className="relative h-16 w-16 shrink-0 rounded-md overflow-hidden bg-surface-muted">
                {item.imageUrl && (
                  <Image src={item.imageUrl} alt={item.name} fill className="object-cover" sizes="64px" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary line-clamp-2">{item.name}</p>
                <p className="text-xs text-text-muted mt-0.5">
                  {[
                    item.selectedOptions.woodType.label,
                    item.selectedOptions.finish.label,
                    item.selectedOptions.size.label,
                  ].join(" · ")}
                </p>
                <p className="text-xs text-text-secondary mt-0.5">×{item.quantity}</p>
              </div>
              <p className="text-sm font-semibold text-text-primary shrink-0">
                {formatCurrency(item.lineTotalVnd)}
              </p>
            </div>
          ))}
        </div>
      ) : null}

      {hydrated && (
        <>
          <Divider />
          <div className="flex flex-col gap-1.5 text-sm">
            <div className="flex justify-between text-text-secondary">
              <span>{tCart("subtotal")}</span>
              <span>{formatCurrency(hydrated.subtotalVnd)}</span>
            </div>
            <Divider className="my-1" />
            <div className="flex justify-between font-semibold text-text-primary">
              <span>{tCart("total")}</span>
              <span className="text-base">{formatCurrency(hydrated.totalVnd)}</span>
            </div>
          </div>
        </>
      )}
      </div>
    </div>
  );
}
