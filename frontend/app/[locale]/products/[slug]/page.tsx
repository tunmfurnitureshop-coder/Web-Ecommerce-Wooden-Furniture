import { notFound } from "next/navigation";
import { api } from "@/lib/api";
import type { ProductDetail } from "@/features/product/product.types";
import { ProductDetailClient } from "@/components/product/ProductDetailClient";

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
      <ProductDetailClient product={product} locale={locale} />
    </div>
  );
}
