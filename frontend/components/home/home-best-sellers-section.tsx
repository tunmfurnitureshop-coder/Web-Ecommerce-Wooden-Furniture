import { getTranslations } from "next-intl/server";
import { Section } from "@/design-system/primitives/section";
import { Container } from "@/design-system/primitives/container";
import { ProductRail } from "@/design-system/commerce/product-rail";
import { mapRelatedToCard } from "@/design-system/commerce/map-related-to-card";
import type { BestSellerItem } from "@/features/product/product.types";

/** "Hàng bán chạy" rail. Hidden when there are no best-sellers. */
export async function HomeBestSellersSection({ items }: { items: BestSellerItem[] }) {
  if (!items.length) return null;
  const t = await getTranslations("home");

  return (
    <Section>
      <Container>
        <ProductRail
          title={t("bestSellersTitle")}
          products={items.map(mapRelatedToCard)}
          viewAllHref="/products?sort=rating_desc"
          viewAllLabel={t("viewAll")}
        />
      </Container>
    </Section>
  );
}
