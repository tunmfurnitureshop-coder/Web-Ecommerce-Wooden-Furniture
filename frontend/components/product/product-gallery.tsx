"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { ProductImageItem } from "@/features/product/product.types";

interface ProductGalleryProps {
  images: ProductImageItem[];
  activeImage: string | null;
  onActiveImageChange: (url: string) => void;
  productName: string;
  emptyLabel: string;
}

/**
 * Mobile (`<lg`): horizontal scroll-snap swipe gallery + dot indicators (CSS only,
 * no carousel lib). Desktop (`lg+`): the original main-image + thumbnail strip,
 * driven by `activeImage` so finish-linked image swaps keep working.
 */
export function ProductGallery({
  images,
  activeImage,
  onActiveImageChange,
  productName,
  emptyLabel,
}: ProductGalleryProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el || el.clientWidth === 0) return;
    setActiveIndex(Math.round(el.scrollLeft / el.clientWidth));
  };

  return (
    <>
      {/* Mobile: swipe gallery */}
      <div className="lg:hidden">
        {images.length > 0 ? (
          <>
            <div
              ref={scrollRef}
              onScroll={handleScroll}
              tabIndex={0}
              role="group"
              aria-label={productName}
              className="flex snap-x snap-mandatory overflow-x-auto rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus"
            >
              {images.map((img, i) => (
                <div
                  key={img.id}
                  className="relative aspect-[4/5] w-full shrink-0 snap-center bg-surface-muted"
                >
                  <Image
                    src={img.imageUrl}
                    alt={img.altText ?? productName}
                    fill
                    className="object-cover"
                    sizes="100vw"
                    priority={i === 0}
                  />
                </div>
              ))}
            </div>
            {images.length > 1 && (
              <div className="mt-2 flex justify-center gap-1.5">
                {images.map((img, i) => (
                  <span
                    key={img.id}
                    aria-hidden
                    className={cn(
                      "h-1.5 rounded-full transition-all",
                      i === activeIndex ? "w-4 bg-brand" : "w-1.5 bg-border-strong",
                    )}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="flex aspect-[4/5] items-center justify-center rounded-lg bg-surface-muted text-sm text-text-muted">
            {emptyLabel}
          </div>
        )}
      </div>

      {/* Desktop: main image + thumbnails */}
      <div className="hidden flex-col gap-3 lg:flex">
        <div className="relative aspect-[4/5] overflow-hidden rounded-lg bg-surface-muted">
          {activeImage ? (
            <Image src={activeImage} alt={productName} fill className="object-cover" priority sizes="60vw" />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-text-muted">{emptyLabel}</div>
          )}
        </div>
        {images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {images.map((img) => (
              <button
                key={img.id}
                type="button"
                onClick={() => onActiveImageChange(img.imageUrl)}
                aria-label={img.altText ?? productName}
                className={cn(
                  "relative h-16 w-16 shrink-0 overflow-hidden rounded-md border-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus",
                  activeImage === img.imageUrl ? "border-brand" : "border-border-default",
                )}
              >
                <Image src={img.imageUrl} alt={img.altText ?? productName} fill className="object-cover" sizes="64px" />
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
