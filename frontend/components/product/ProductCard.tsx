import { Link } from "@/lib/i18n";
import { formatVnd } from "@/lib/format-currency";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ProductListItem } from "@/features/product/product.types";

interface ProductCardProps {
  product: ProductListItem;
}

export function ProductCard({ product }: ProductCardProps) {
  return (
    <Link href={`/products/${product.slug}`}>
      <Card className="overflow-hidden hover:shadow-md transition-shadow h-full">
        <div className="aspect-square bg-muted relative">
          {product.primaryImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.primaryImageUrl}
              alt={product.name}
              className="object-cover w-full h-full"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
              No image
            </div>
          )}
          <Badge className="absolute top-2 left-2 text-xs">
            {product.room.name}
          </Badge>
        </div>
        <CardContent className="pt-4">
          <h3 className="font-semibold text-sm line-clamp-2">{product.name}</h3>
          {product.shortDescription && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {product.shortDescription}
            </p>
          )}
        </CardContent>
        <CardFooter className="pt-0">
          <p className="font-bold text-primary">
            {formatVnd(product.basePriceVnd)}
          </p>
        </CardFooter>
      </Card>
    </Link>
  );
}
