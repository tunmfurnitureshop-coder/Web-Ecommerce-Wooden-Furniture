"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useCartStore } from "@/features/cart/cart.store";
import { hydrateCart } from "@/features/cart/cart.api";
import { cartQuote } from "@/features/promotion/promotion.api";
import { Container } from "@/design-system/primitives/container";
import { EmptyState } from "@/design-system/components/empty-state";
import { Button } from "@/design-system/components/button";
import { CartItem as CartItemDS } from "@/design-system/commerce/cart-item";
import { Skeleton } from "@/design-system/components/skeleton";
import { CouponInput } from "@/design-system/commerce/CouponInput";
import { DiscountBreakdown } from "@/design-system/commerce/DiscountBreakdown";
import { PromotionSummary } from "@/design-system/commerce/PromotionSummary";
import { ShoppingBag, ShieldCheck, RefreshCw, HeadphonesIcon } from "lucide-react";
import { formatCurrency } from "@/lib/format-currency";
import { cartItemKey } from "@/features/cart/cart.types";
import type { CartHydrateResponse } from "@/features/cart/cart.types";
import type { CartQuoteResponse } from "@/features/promotion/promotion.types";
import { trackEvent } from "@/features/analytics/analytics.client";

export default function CartPage() {
  const t = useTranslations("cart");
  const { items, removeItem, updateQuantity } = useCartStore();
  const [hydrated, setHydrated] = useState<CartHydrateResponse | null>(null);
  const [quote, setQuote] = useState<CartQuoteResponse | null>(null);
  const [couponCode, setCouponCode] = useState<string | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [loading, setLoading] = useState(false);

  const runQuote = useCallback(
    (coupon?: string | null) => {
      if (items.length === 0) return;
      setCouponLoading(true);
      cartQuote({ locale: "vi", items, couponCode: coupon ?? undefined })
        .then(setQuote)
        .catch(console.error)
        .finally(() => setCouponLoading(false));
    },
    [items]
  );

  useEffect(() => {
    if (items.length === 0) { setHydrated(null); setQuote(null); return; }
    setLoading(true);
    Promise.all([
      hydrateCart({ locale: "vi", items }),
      cartQuote({ locale: "vi", items, couponCode: couponCode ?? undefined }),
    ])
      .then(([h, q]) => { setHydrated(h); setQuote(q); })
      .catch(console.error)
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  useEffect(() => {
    if (items.length > 0) {
      trackEvent({ eventName: "CART_VIEWED" });
    }
  }, [items.length]);

  function handleCouponApply(code: string) {
    setCouponCode(code);
    runQuote(code);
  }

  function handleCouponRemove() {
    setCouponCode(null);
    runQuote(null);
  }

  if (items.length === 0) {
    return (
      <Container className="py-20">
        <EmptyState
          icon={<ShoppingBag className="h-14 w-14" />}
          title={t("empty")}
          description={t("emptyDesc")}
          action={
            <Link href="/products">
              <Button variant="primary">{t("continueShopping")}</Button>
            </Link>
          }
        />
      </Container>
    );
  }

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const hasDiscount = (quote?.promotionDiscountVnd ?? 0) > 0;

  return (
    <Container className="py-8 pb-16">
      <h1 className="text-3xl font-bold text-text-primary mb-8">
        {t("title")} <span className="text-lg font-normal text-text-muted">({totalItems})</span>
      </h1>

      <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
        {/* Cart items */}
        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="flex flex-col gap-4">
              {items.map((_, i) => (
                <div key={i} className="flex gap-4 py-4">
                  <Skeleton className="h-20 w-20 rounded-md shrink-0" />
                  <div className="flex-1 flex flex-col gap-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                    <Skeleton className="h-9 w-28" />
                  </div>
                </div>
              ))}
            </div>
          ) : hydrated ? (
            <div className="divide-y divide-border-default">
              {hydrated.items.map((item, i) => {
                const storeItem = items[i];
                if (!storeItem) return null;
                const key = cartItemKey(storeItem);
                return (
                  <CartItemDS
                    key={key}
                    item={{
                      id: key,
                      productId: item.productId,
                      productName: item.name,
                      productSlug: item.productId,
                      imageUrl: item.imageUrl ?? "/images/placeholder-product.jpg",
                      selectedOptionsLabel: [
                        item.selectedOptions.woodType.label,
                        item.selectedOptions.finish.label,
                        item.selectedOptions.size.label,
                      ],
                      quantity: item.quantity,
                      unitPriceFormatted: formatCurrency(item.unitPriceVnd),
                      lineTotalFormatted: formatCurrency(item.lineTotalVnd),
                      availabilityState: "AVAILABLE",
                    }}
                    onQuantityChange={(_, qty) => updateQuantity(key, qty)}
                    onRemove={() => removeItem(key)}
                    removeLabel={t("remove")}
                  />
                );
              })}
            </div>
          ) : null}
        </div>

        {/* Order summary */}
        <div className="w-full lg:w-80 xl:w-96 shrink-0 flex flex-col gap-4">
          <CouponInput
            onApply={handleCouponApply}
            onRemove={handleCouponRemove}
            appliedCode={quote?.appliedPromotion?.code ?? (couponCode && !quote?.couponError ? couponCode : null)}
            errorMessage={quote?.couponError ?? null}
            loading={couponLoading}
            inputLabel={t("couponCode")}
            applyLabel={t("applyCoupon")}
            removeLabel={t("removeCoupon")}
            placeholder="SUMMER20"
          />

          {quote?.appliedPromotion && (
            <PromotionSummary
              promotionLabel={quote.appliedPromotion.name}
              promotionCode={quote.appliedPromotion.code}
              discountFormatted={formatCurrency(quote.appliedPromotion.discountVnd)}
              discountLabel={t("discount")}
            />
          )}

          {hasDiscount ? (
            <DiscountBreakdown
              subtotalFormatted={formatCurrency(quote?.merchandiseSubtotalVnd ?? hydrated?.subtotalVnd ?? 0)}
              discountFormatted={formatCurrency(quote?.promotionDiscountVnd ?? 0)}
              totalFormatted={formatCurrency(quote?.totalVnd ?? hydrated?.totalVnd ?? 0)}
              subtotalLabel={t("subtotal")}
              discountLabel={t("discount")}
              totalLabel={t("total")}
            />
          ) : (
            <div className="rounded-lg border border-border-default bg-surface p-5 flex flex-col gap-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-secondary">{t("subtotal")}</span>
                <span className="font-medium text-text-primary">
                  {formatCurrency(quote?.merchandiseSubtotalVnd ?? hydrated?.subtotalVnd ?? 0)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-text-primary">{t("total")}</span>
                <span className="text-lg font-bold text-text-primary">
                  {formatCurrency(quote?.totalVnd ?? hydrated?.totalVnd ?? 0)}
                </span>
              </div>
            </div>
          )}

          {/* Payment confidence */}
          <div className="rounded-lg border border-border-default bg-surface p-4 flex flex-col gap-3 text-xs text-text-muted">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-success shrink-0" aria-hidden />
              <span>{t("securePayment")}</span>
            </div>
            <div className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-brand shrink-0" aria-hidden />
              <span>{t("returns30Days")}</span>
            </div>
            <div className="flex items-center gap-2">
              <HeadphonesIcon className="h-4 w-4 text-info shrink-0" aria-hidden />
              <span>{t("support247")}</span>
            </div>
          </div>

          <Link href={{ pathname: "/checkout", query: couponCode ? { coupon: couponCode } : undefined }}>
            <Button variant="primary" size="lg" fullWidth disabled={loading || !hydrated}>
              {t("checkout")}
            </Button>
          </Link>

          <Link href="/products" className="text-center text-sm text-text-muted hover:text-text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus rounded-sm">
            {t("continueShopping")}
          </Link>
        </div>
      </div>
    </Container>
  );
}
