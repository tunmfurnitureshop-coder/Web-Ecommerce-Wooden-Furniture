import { notFound } from "next/navigation";
import { api } from "@/lib/api";
import type { ProductDetail } from "@/features/product/product.types";
import { ProductDetailClient } from "@/components/product/ProductDetailClient";
import { Container } from "@/design-system/primitives/container";

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
    <Container className="py-8 pb-16">
      <ProductDetailClient product={product} locale={locale} />
    </Container>
  );
}
