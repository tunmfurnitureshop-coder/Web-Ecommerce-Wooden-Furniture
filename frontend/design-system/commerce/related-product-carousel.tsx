"use client";

import { useRef } from "react";
import { Link } from "@/i18n/navigation";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatCurrency } from "@/lib/format-currency";

interface RelatedProduct {
  id: string;
  name: string;
  slug: string;
  basePriceVnd: number;
  primaryImageUrl?: string | null;
}

interface RelatedProductCarouselProps {
  products: RelatedProduct[];
  title: string;
  locale: string;
}

export function RelatedProductCarousel({ products, title, locale }: RelatedProductCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  if (!products.length) return null;

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir === "left" ? -300 : 300, behavior: "smooth" });
  };

  return (
    <section className="py-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-text-primary">{title}</h2>
        <div className="flex gap-1">
          <button
            onClick={() => scroll("left")}
            className="p-2 rounded-full border border-border-default text-text-secondary hover:bg-surface-muted transition-colors"
            aria-label="Scroll left"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => scroll("right")}
            className="p-2 rounded-full border border-border-default text-text-secondary hover:bg-surface-muted transition-colors"
            aria-label="Scroll right"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div ref={scrollRef} className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide snap-x">
        {products.map((p) => (
          <Link
            key={p.id}
            href={`/products/${p.slug}`}
            locale={locale}
            className="flex-shrink-0 w-44 snap-start group block"
          >
            <div className="relative aspect-square rounded-lg overflow-hidden bg-surface-muted">
              {p.primaryImageUrl ? (
                <Image
                  src={p.primaryImageUrl}
                  alt={p.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full bg-surface-subtle" />
              )}
            </div>
            <p className="mt-2 text-sm font-medium text-text-primary group-hover:text-brand line-clamp-2 transition-colors">
              {p.name}
            </p>
            <p className="text-sm text-text-secondary">{formatCurrency(p.basePriceVnd)}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
