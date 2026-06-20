"use client";

import { useState } from "react";
import { ProductOptionSelector } from "./ProductOptionSelector";
import type { ProductDetail, ProductImageItem } from "@/features/product/product.types";

interface Props {
  product: ProductDetail;
  locale: string;
}

export function ProductDetailClient({ product, locale }: Props) {
  const [activeImage, setActiveImage] = useState<string | null>(
    product.primaryImageUrl ?? product.images[0]?.imageUrl ?? null
  );

  function handleFinishChange(finishCode: string) {
    const linked = product.images.find((img) => img.linkedFinishCode === finishCode);
    if (linked) {
      setActiveImage(linked.imageUrl);
    }
  }

  function handleImageChange(url: string | null) {
    setActiveImage(url);
  }

  const galleryImages: ProductImageItem[] = product.images.length > 0
    ? product.images
    : product.primaryImageUrl
    ? [{ id: "primary", imageUrl: product.primaryImageUrl, altText: product.name, sortOrder: 0, isPrimary: true, linkedFinishCode: null }]
    : [];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
      <div className="space-y-3">
        <div className="aspect-square bg-muted rounded-lg overflow-hidden">
          {activeImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={activeImage}
              alt={product.name}
              className="w-full h-full object-cover transition-opacity duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
              No image
            </div>
          )}
        </div>

        {galleryImages.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {galleryImages.map((img) => (
              <button
                key={img.id}
                onClick={() => setActiveImage(img.imageUrl)}
                className={`flex-shrink-0 w-16 h-16 rounded overflow-hidden border-2 transition-colors ${
                  activeImage === img.imageUrl ? "border-primary" : "border-transparent"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.imageUrl} alt={img.altText ?? product.name} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div>
        <p className="text-sm text-muted-foreground mb-1">{product.sku}</p>
        <h1 className="text-2xl font-bold mb-4">{product.name}</h1>
        {product.description && (
          <p className="text-muted-foreground mb-6">{product.description}</p>
        )}
        {product.specifications && (
          <div className="mb-6">
            <h3 className="font-semibold mb-2 text-sm">Thông số kỹ thuật</h3>
            <dl className="space-y-1">
              {Object.entries(product.specifications).map(([k, v]) => (
                <div key={k} className="flex gap-2 text-sm">
                  <dt className="text-muted-foreground capitalize">{k}:</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}
        <ProductOptionSelector
          product={product}
          locale={locale}
          onImageChange={handleImageChange}
          onFinishChange={handleFinishChange}
        />
      </div>
    </div>
  );
}
