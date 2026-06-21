"use client";

import { useEffect, useState } from "react";
import { useRecentlyViewedStore } from "@/features/recently-viewed/recently-viewed.store";
import { hydrateRecentlyViewed } from "@/features/recently-viewed/recently-viewed.api";
import { Link } from "@/i18n/navigation";
import Image from "next/image";
import { formatCurrency } from "@/lib/format-currency";

interface RecentlyViewedItem {
  id: string;
  name: string;
  slug: string;
  basePriceVnd: number;
  primaryImageUrl?: string | null;
}

interface RecentlyViewedSectionProps {
  title: string;
  locale: string;
  excludeProductId?: string;
}

export function RecentlyViewedSection({ title, locale, excludeProductId }: RecentlyViewedSectionProps) {
  const { productIds } = useRecentlyViewedStore();
  const [items, setItems] = useState<RecentlyViewedItem[]>([]);

  useEffect(() => {
    const ids = productIds.filter((id) => id !== excludeProductId);
    if (!ids.length) return;
    hydrateRecentlyViewed(ids, locale).then(setItems);
  }, [productIds, locale, excludeProductId]);

  if (!items.length) return null;

  return (
    <section className="py-6 border-t border-border-default">
      <h2 className="text-xl font-semibold text-text-primary mb-4">{title}</h2>
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
        {items.map((p) => (
          <Link
            key={p.id}
            href={`/products/${p.slug}`}
            locale={locale}
            className="flex-shrink-0 w-40 group"
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
