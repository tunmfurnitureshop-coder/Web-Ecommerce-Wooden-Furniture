import { notFound } from "next/navigation";
import { api } from "@/lib/api";
import type { ProductDetail } from "@/features/product/product.types";
import { ProductOptionSelector } from "@/components/product/ProductOptionSelector";

async function getProduct(slug: string, locale: string) {
  try {
    return await api.get<ProductDetail>(`/api/v1/products/${slug}?locale=${locale}`);
  } catch {
    return null;
  }
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const product = await getProduct(slug, locale);
  if (!product) notFound();

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Image */}
        <div className="aspect-square bg-muted rounded-lg overflow-hidden">
          {product.primaryImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.primaryImageUrl}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              No image
            </div>
          )}
        </div>

        {/* Details + configurator */}
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
          <ProductOptionSelector product={product} locale={locale} />
        </div>
      </div>
    </div>
  );
}
