import { Link } from "@/i18n/navigation";
import Image from "next/image";

interface CollectionCardProps {
  id: string;
  slug: string;
  name: string;
  shortDescription?: string | null;
  coverImageUrl?: string | null;
  productCount?: number;
  locale: string;
}

export function CollectionCard({
  slug, name, shortDescription, coverImageUrl, productCount, locale,
}: CollectionCardProps) {
  return (
    <Link
      href={`/collections/${slug}`}
      locale={locale}
      className="group block rounded-xl overflow-hidden border border-border-default bg-surface hover:border-border-strong transition-colors"
    >
      <div className="relative aspect-[4/3] bg-surface-muted overflow-hidden">
        {coverImageUrl ? (
          <Image
            src={coverImageUrl}
            alt={name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full bg-surface-subtle" />
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-text-primary group-hover:text-brand transition-colors line-clamp-1">
          {name}
        </h3>
        {shortDescription && (
          <p className="text-sm text-text-secondary mt-1 line-clamp-2">{shortDescription}</p>
        )}
        {productCount !== undefined && (
          <p className="text-xs text-text-muted mt-2">{productCount} sản phẩm</p>
        )}
      </div>
    </Link>
  );
}
