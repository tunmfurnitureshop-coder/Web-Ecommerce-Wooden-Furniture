import { cn } from "@/lib/utils";
import { ProductCard, type ProductCardViewModel } from "./product-card";

interface ProductGridProps {
  products: ProductCardViewModel[];
  onWishlistToggle?: (id: string, wishlisted: boolean) => void;
  className?: string;
  unavailableLabel?: string;
}

export function ProductGrid({ products, onWishlistToggle, className, unavailableLabel }: ProductGridProps) {
  return (
    <div className={cn("grid grid-cols-2 gap-4 md:gap-6 lg:grid-cols-3 xl:grid-cols-4", className)}>
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          onWishlistToggle={onWishlistToggle}
          unavailableLabel={unavailableLabel}
        />
      ))}
    </div>
  );
}
