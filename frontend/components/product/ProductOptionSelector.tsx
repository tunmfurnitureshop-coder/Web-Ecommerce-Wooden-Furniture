"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { useCartStore } from "@/features/cart/cart.store";
import { getPricingQuote } from "@/features/product/product.api";
import { PriceBreakdown } from "./PriceBreakdown";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ProductDetail, PricingQuoteResponse } from "@/features/product/product.types";

interface Props {
  product: ProductDetail;
  locale: string;
}

export function ProductOptionSelector({ product, locale }: Props) {
  const t = useTranslations("product");
  const addItem = useCartStore((s) => s.addItem);

  const [woodType, setWoodType] = useState(product.availableOptions.woodTypes[0]?.code ?? "");
  const [finish, setFinish] = useState(product.availableOptions.finishes[0]?.code ?? "");
  const [size, setSize] = useState(product.availableOptions.sizes[0]?.code ?? "");
  const [quantity, setQuantity] = useState(1);
  const [quote, setQuote] = useState<PricingQuoteResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!woodType || !finish || !size) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const q = await getPricingQuote({
          productId: product.id,
          quantity,
          selectedOptions: { woodType, finish, size },
        });
        setQuote(q);
      } catch {
        setQuote(null);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [woodType, finish, size, quantity, product.id]);

  function handleAddToCart() {
    addItem({ productId: product.id, quantity, selectedOptions: { woodType, finish, size } });
    alert("Đã thêm vào giỏ hàng!");
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>{t("woodType")}</Label>
        <Select value={woodType} onValueChange={setWoodType}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {product.availableOptions.woodTypes.map((wt) => (
              <SelectItem key={wt.code} value={wt.code}>{wt.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>{t("finish")}</Label>
        <Select value={finish} onValueChange={setFinish}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {product.availableOptions.finishes.map((fo) => (
              <SelectItem key={fo.code} value={fo.code}>{fo.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>{t("size")}</Label>
        <Select value={size} onValueChange={setSize}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {product.availableOptions.sizes.map((so) => (
              <SelectItem key={so.code} value={so.code}>
                {so.name}{so.widthCm ? ` (${so.widthCm}×${so.depthCm}×${so.heightCm}cm)` : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>{t("quantity")}</Label>
        <input
          type="number"
          min={1}
          value={quantity}
          onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
          className="w-20 border rounded px-2 py-1 text-sm"
        />
      </div>

      {quote && <PriceBreakdown quote={quote} loading={loading} />}

      <Button className="w-full" onClick={handleAddToCart} disabled={!quote || loading}>
        {t("addToCart")}
      </Button>
    </div>
  );
}
