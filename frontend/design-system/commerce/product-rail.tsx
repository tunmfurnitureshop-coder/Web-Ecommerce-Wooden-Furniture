"use client";

import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { ProductCard, type ProductCardViewModel } from "./product-card";

interface ProductRailProps {
  products: ProductCardViewModel[];
  title: string;
  viewAllHref?: string;
  viewAllLabel?: string;
  unavailableLabel?: string;
  className?: string;
}

/**
 * Horizontal product carousel built on embla. Reused for related products,
 * deals and best-sellers rails. Renders the shared ProductCard; hides itself
 * when there are no products.
 */
export function ProductRail({
  products,
  title,
  viewAllHref,
  viewAllLabel,
  unavailableLabel,
  className,
}: ProductRailProps) {
  const t = useTranslations("common");
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    dragFree: true,
    containScroll: "trimSnaps",
  });
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCanPrev(emblaApi.canScrollPrev());
    setCanNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect).on("reInit", onSelect);
    return () => {
      emblaApi.off("select", onSelect).off("reInit", onSelect);
    };
  }, [emblaApi, onSelect]);

  if (!products.length) return null;

  return (
    <section
      className={cn("flex flex-col gap-6", className)}
      aria-roledescription="carousel"
      aria-label={title}
    >
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-2xl md:text-3xl font-bold text-text-primary">{title}</h2>
        <div className="flex items-center gap-2">
          {viewAllHref && (
            <Link
              href={viewAllHref}
              className="flex items-center gap-1 text-sm font-medium text-brand hover:text-brand-hover transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus rounded-sm"
            >
              {viewAllLabel}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          )}
          <button
            type="button"
            onClick={() => emblaApi?.scrollPrev()}
            disabled={!canPrev}
            aria-label={t("scrollPrev")}
            className="p-2 rounded-full border border-border-default text-text-secondary hover:bg-surface-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => emblaApi?.scrollNext()}
            disabled={!canNext}
            aria-label={t("scrollNext")}
            className="p-2 rounded-full border border-border-default text-text-secondary hover:bg-surface-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus"
          >
            <ChevronRight className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>

      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex gap-4 md:gap-6">
          {products.map((product) => (
            <div
              key={product.id}
              className="min-w-0 flex-[0_0_46%] sm:flex-[0_0_38%] md:flex-[0_0_30%] lg:flex-[0_0_23%]"
            >
              <ProductCard product={product} unavailableLabel={unavailableLabel} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
