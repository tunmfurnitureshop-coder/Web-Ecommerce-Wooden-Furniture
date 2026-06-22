import { Link } from "@/i18n/navigation";
import { ProductCard } from "./product-card";
import type { ProductCardViewModel } from "./product-card";

interface CampaignProductSectionProps {
  title: string;
  products: ProductCardViewModel[];
  locale: string;
}

export function CampaignProductSection({
  title,
  products,
  locale,
}: CampaignProductSectionProps) {
  if (products.length === 0) return null;
  return (
    <section className="flex flex-col gap-6">
      <h2 className="text-xl font-semibold text-text-primary">{title}</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {products.map((p) => (
          <Link key={p.id} href={`/products/${p.slug}`} locale={locale}>
            <ProductCard product={p} />
          </Link>
        ))}
      </div>
    </section>
  );
}
