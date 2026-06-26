import { getTranslations } from "next-intl/server";
import { Section } from "@/design-system/primitives/section";
import { Container } from "@/design-system/primitives/container";
import { ProductRail } from "@/design-system/commerce/product-rail";
import { formatCurrency } from "@/lib/format-currency";
import type { ProductDealItem } from "@/features/product/product.types";
import type { ProductCardViewModel } from "@/design-system/commerce/product-card";

/** "Giá siêu tốt" rail with strike-through prices. Hidden when there are no deals. */
export async function HomeDealsSection({ deals }: { deals: ProductDealItem[] }) {
  if (!deals.length) return null;
  const t = await getTranslations("home");

  const products: ProductCardViewModel[] = deals.map((d) => ({
    id: d.id,
    slug: d.slug,
    title: d.name,
    primaryImageUrl: d.primaryImageUrl ?? "/images/placeholder-product.jpg",
    imageAlt: d.name,
    priceFormatted: formatCurrency(d.dealPriceVnd),
    originalPriceFormatted: formatCurrency(d.originalPriceVnd),
    discountBadge: t("dealBadge", { pct: d.discountPct }),
    isAvailable: true,
    isWishlisted: false,
  }));

  return (
    <Section>
      <Container>
        <ProductRail title={t("dealsTitle")} products={products} />
      </Container>
    </Section>
  );
}
