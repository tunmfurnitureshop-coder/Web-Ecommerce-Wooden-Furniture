"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useCartStore } from "@/features/cart/cart.store";
import { getPricingQuote } from "@/features/product/product.api";
import { ProductReviewsSection } from "@/components/review/ProductReviewsSection";
import { Button } from "@/design-system/components/button";
import { QuantityStepper } from "@/design-system/components/quantity-stepper";
import { RadioCard } from "@/design-system/components/radio-card";
import { Badge } from "@/design-system/components/badge";
import { LoadingOverlay } from "@/design-system/components/loading-overlay";
import { Alert } from "@/design-system/components/alert";
import { Stack } from "@/design-system/primitives/stack";
import { Divider } from "@/design-system/primitives/divider";
import { Breadcrumb } from "@/design-system/layout/breadcrumb";
import { formatCurrency } from "@/lib/format-currency";
import { ShoppingCart } from "lucide-react";
import type { ProductDetail, ProductImageItem, PricingQuoteResponse } from "@/features/product/product.types";

interface Props {
  product: ProductDetail;
  locale: string;
}

export function ProductDetailClient({ product, locale }: Props) {
  const t = useTranslations("product");
  const addItem = useCartStore((s) => s.addItem);

  const [activeImage, setActiveImage] = useState<string | null>(
    product.primaryImageUrl ?? product.images[0]?.imageUrl ?? null
  );
  const [woodType, setWoodType] = useState(product.availableOptions.woodTypes[0]?.code ?? "");
  const [finish, setFinish] = useState(product.availableOptions.finishes[0]?.code ?? "");
  const [size, setSize] = useState(product.availableOptions.sizes[0]?.code ?? "");
  const [quantity, setQuantity] = useState(1);
  const [quote, setQuote] = useState<PricingQuoteResponse | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [cartSuccess, setCartSuccess] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hasAllOptions = woodType && finish && size;

  const galleryImages: ProductImageItem[] =
    product.images.length > 0
      ? product.images
      : product.primaryImageUrl
      ? [{ id: "primary", imageUrl: product.primaryImageUrl, altText: product.name, sortOrder: 0, isPrimary: true, linkedFinishCode: null }]
      : [];

  useEffect(() => {
    if (!woodType || !finish || !size) { setQuote(null); return; }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setQuoteLoading(true);
      try {
        const q = await getPricingQuote({ productId: product.id, quantity, selectedOptions: { woodType, finish, size } });
        setQuote(q);
      } catch {
        setQuote(null);
      } finally {
        setQuoteLoading(false);
      }
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [woodType, finish, size, quantity, product.id]);

  const handleFinishChange = useCallback((code: string) => {
    setFinish(code);
    const linked = product.images.find((img) => img.linkedFinishCode === code);
    if (linked) setActiveImage(linked.imageUrl);
  }, [product.images]);

  const handleAddToCart = () => {
    if (!hasAllOptions) return;
    addItem({ productId: product.id, quantity, selectedOptions: { woodType, finish, size } });
    setCartSuccess(true);
    setTimeout(() => setCartSuccess(false), 3000);
  };

  const breadcrumbs = [
    { label: "Trang chủ", href: "/" },
    { label: "Sản phẩm", href: "/products" },
    { label: product.name },
  ];

  return (
    <div className="flex flex-col gap-12">
      {/* Breadcrumb */}
      <Breadcrumb items={breadcrumbs} />

      {/* Main 2-col */}
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[3fr_2fr]">
        {/* Left: Image gallery */}
        <div className="flex flex-col gap-3">
          <div className="relative aspect-[4/5] overflow-hidden rounded-lg bg-surface-muted">
            {activeImage ? (
              <Image
                src={activeImage}
                alt={product.name}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 1024px) 100vw, 60vw"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-text-muted">
                {t("outOfStock")}
              </div>
            )}
          </div>
          {galleryImages.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {galleryImages.map((img) => (
                <button
                  key={img.id}
                  type="button"
                  onClick={() => setActiveImage(img.imageUrl)}
                  aria-label={img.altText ?? product.name}
                  className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-md border-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus ${
                    activeImage === img.imageUrl ? "border-brand" : "border-border-default"
                  }`}
                >
                  <Image src={img.imageUrl} alt={img.altText ?? product.name} fill className="object-cover" sizes="64px" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Product info + options */}
        <Stack gap="6">
          <Stack gap="2">
            <p className="text-xs text-text-muted font-mono">{product.sku}</p>
            <h1 className="text-2xl font-bold text-text-primary">{product.name}</h1>
          </Stack>

          {/* Price block */}
          <div className="flex items-center gap-3">
            <p className="text-2xl font-bold text-text-primary">
              {quoteLoading ? (
                <span className="inline-block h-7 w-32 animate-pulse rounded bg-surface-muted" />
              ) : quote ? (
                formatCurrency(quote.unitPriceVnd)
              ) : (
                formatCurrency(product.basePriceVnd)
              )}
            </p>
            {quoteLoading && (
              <p className="text-xs text-text-muted">{t("quantity")}</p>
            )}
          </div>

          <Divider />

          {/* Wood type selector */}
          {product.availableOptions.woodTypes.length > 0 && (
            <Stack gap="2">
              <p className="text-sm font-semibold text-text-primary">{t("woodType")}</p>
              <div className="flex flex-wrap gap-2" role="group" aria-label={t("woodType")}>
                {product.availableOptions.woodTypes.map((wt) => (
                  <RadioCard
                    key={wt.code}
                    name="woodType"
                    value={wt.code}
                    checked={woodType === wt.code}
                    onChange={setWoodType}
                  >
                    <div className="text-sm">
                      <p className="font-medium text-text-primary">{wt.name}</p>
                      {wt.priceDeltaVnd !== 0 && (
                        <p className="text-xs text-text-muted">+{formatCurrency(wt.priceDeltaVnd)}</p>
                      )}
                    </div>
                  </RadioCard>
                ))}
              </div>
            </Stack>
          )}

          {/* Finish selector */}
          {product.availableOptions.finishes.length > 0 && (
            <Stack gap="2">
              <p className="text-sm font-semibold text-text-primary">{t("finish")}</p>
              <div className="flex flex-wrap gap-2" role="group" aria-label={t("finish")}>
                {product.availableOptions.finishes.map((fo) => (
                  <RadioCard
                    key={fo.code}
                    name="finish"
                    value={fo.code}
                    checked={finish === fo.code}
                    onChange={handleFinishChange}
                  >
                    <p className="text-sm font-medium text-text-primary">{fo.name}</p>
                  </RadioCard>
                ))}
              </div>
            </Stack>
          )}

          {/* Size selector */}
          {product.availableOptions.sizes.length > 0 && (
            <Stack gap="2">
              <p className="text-sm font-semibold text-text-primary">{t("size")}</p>
              <div className="flex flex-wrap gap-2" role="group" aria-label={t("size")}>
                {product.availableOptions.sizes.map((so) => (
                  <RadioCard
                    key={so.code}
                    name="size"
                    value={so.code}
                    checked={size === so.code}
                    onChange={setSize}
                  >
                    <div className="text-sm">
                      <p className="font-medium text-text-primary">{so.name}</p>
                      {so.widthCm && (
                        <p className="text-xs text-text-muted">{so.widthCm}×{so.depthCm}×{so.heightCm}cm</p>
                      )}
                    </div>
                  </RadioCard>
                ))}
              </div>
            </Stack>
          )}

          <Divider />

          {/* Quantity + Add to Cart */}
          <Stack gap="4">
            <div className="flex items-center gap-3">
              <p className="text-sm font-semibold text-text-primary w-20">{t("quantity")}</p>
              <QuantityStepper value={quantity} onChange={setQuantity} min={1} max={99} />
            </div>

            {cartSuccess && (
              <Alert variant="success">{t("addToCart")} ✓</Alert>
            )}

            {!hasAllOptions && (
              <p className="text-xs text-text-muted" role="alert">
                Vui lòng chọn đầy đủ tùy chọn sản phẩm
              </p>
            )}

            <div className="relative">
              <Button
                variant="primary"
                size="lg"
                fullWidth
                onClick={handleAddToCart}
                disabled={!hasAllOptions || quoteLoading}
                isLoading={quoteLoading}
              >
                <ShoppingCart className="h-4 w-4" aria-hidden />
                {t("addToCart")}
              </Button>
              {quoteLoading && <LoadingOverlay label="Đang tính giá..." />}
            </div>
          </Stack>

          {/* Pricing breakdown */}
          {quote && !quoteLoading && (
            <div className="rounded-md bg-surface-muted p-4 text-sm flex flex-col gap-1">
              <p className="font-semibold text-text-primary mb-2">{t("priceBreakdown")}</p>
              <div className="flex justify-between text-text-secondary">
                <span>{t("basePrice")}</span>
                <span>{formatCurrency(quote.breakdown.basePriceVnd)}</span>
              </div>
              {quote.breakdown.woodTypeDeltaVnd !== 0 && (
                <div className="flex justify-between text-text-secondary">
                  <span>{t("woodTypeDelta")}</span>
                  <span>+{formatCurrency(quote.breakdown.woodTypeDeltaVnd)}</span>
                </div>
              )}
              {quote.breakdown.finishDeltaVnd !== 0 && (
                <div className="flex justify-between text-text-secondary">
                  <span>{t("finishDelta")}</span>
                  <span>+{formatCurrency(quote.breakdown.finishDeltaVnd)}</span>
                </div>
              )}
              {quote.breakdown.sizeDeltaVnd !== 0 && (
                <div className="flex justify-between text-text-secondary">
                  <span>{t("sizeDelta")}</span>
                  <span>+{formatCurrency(quote.breakdown.sizeDeltaVnd)}</span>
                </div>
              )}
              <Divider className="my-1" />
              <div className="flex justify-between font-semibold text-text-primary">
                <span>{t("totalPrice")} ×{quantity}</span>
                <span>{formatCurrency(quote.lineTotalVnd)}</span>
              </div>
            </div>
          )}

          {/* Metadata */}
          {product.specifications && Object.keys(product.specifications).length > 0 && (
            <Stack gap="2">
              <p className="text-sm font-semibold text-text-primary">{t("specifications")}</p>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                {Object.entries(product.specifications).map(([k, v]) => (
                  <div key={k} className="contents">
                    <dt className="text-xs text-text-muted capitalize">{k}</dt>
                    <dd className="text-xs text-text-primary">{v}</dd>
                  </div>
                ))}
              </dl>
            </Stack>
          )}
        </Stack>
      </div>

      {/* Description */}
      {product.description && (
        <div className="max-w-2xl">
          <h2 className="text-lg font-semibold text-text-primary mb-3">Mô tả sản phẩm</h2>
          <p className="text-sm text-text-secondary leading-relaxed">{product.description}</p>
        </div>
      )}

      {/* Reviews */}
      <ProductReviewsSection productId={product.id} locale={locale} />
    </div>
  );
}
