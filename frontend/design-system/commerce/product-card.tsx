import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { WishlistButton } from "./wishlist-button";
import { RatingStars } from "./rating-stars";

export interface ProductCardViewModel {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  primaryImageUrl: string;
  imageAlt: string;
  priceFormatted: string;
  rating?: number;
  reviewCount?: number;
  isAvailable: boolean;
  isWishlisted: boolean;
}

interface ProductCardProps {
  product: ProductCardViewModel;
  onWishlistToggle?: (id: string, wishlisted: boolean) => void;
  className?: string;
  unavailableLabel?: string;
}

export function ProductCard({ product, onWishlistToggle, className, unavailableLabel = "Out of stock" }: ProductCardProps) {
  return (
    <article className={cn("group flex flex-col gap-3", className)}>
      <div className="relative overflow-hidden rounded-md bg-surface-muted">
        <Link href={`/products/${product.slug}`} className="block aspect-[4/5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-2 rounded-md">
          <Image
            src={product.primaryImageUrl}
            alt={product.imageAlt}
            fill
            className={cn(
              "object-cover transition-transform duration-300 group-hover:scale-105",
              !product.isAvailable && "opacity-60"
            )}
            sizes="(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 25vw"
          />
          {!product.isAvailable && (
            <div className="absolute inset-x-0 bottom-0 bg-surface/80 py-1 text-center text-xs font-medium text-text-secondary">
              {unavailableLabel}
            </div>
          )}
        </Link>
        {onWishlistToggle && (
          <div className="absolute top-2 right-2">
            <WishlistButton
              productId={product.id}
              isWishlisted={product.isWishlisted}
              onToggle={onWishlistToggle}
            />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <Link
          href={`/products/${product.slug}`}
          className="text-sm font-medium text-text-primary hover:text-brand transition-colors line-clamp-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus rounded-sm"
        >
          {product.title}
        </Link>
        {product.subtitle && (
          <p className="text-xs text-text-muted">{product.subtitle}</p>
        )}
        {product.rating !== undefined && (
          <RatingStars rating={product.rating} count={product.reviewCount} />
        )}
        <p className="text-sm font-semibold text-text-primary">{product.priceFormatted}</p>
      </div>
    </article>
  );
}
