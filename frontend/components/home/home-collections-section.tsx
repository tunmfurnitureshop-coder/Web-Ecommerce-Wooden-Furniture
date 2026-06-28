import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Section } from "@/design-system/primitives/section";
import { Container } from "@/design-system/primitives/container";
import { CollectionGrid } from "@/design-system/commerce/collection-grid";
import { ArrowRight } from "lucide-react";

export interface HomeCollectionItem {
  id: string;
  slug: string;
  name: string;
  shortDescription?: string | null;
  coverImageUrl?: string | null;
}

/** "Bộ sưu tập nổi bật" — up to 3 curated collections. Hidden when empty. */
export async function HomeCollectionsSection({
  collections,
  locale,
}: {
  collections: HomeCollectionItem[];
  locale: string;
}) {
  if (!collections.length) return null;
  const t = await getTranslations("home");

  return (
    <Section className="bg-surface-subtle">
      <Container>
        <div className="flex flex-col gap-8">
          <div className="flex items-end justify-between gap-4">
            <div className="flex flex-col gap-2">
              <h2 className="font-display text-3xl md:text-4xl font-normal text-text-primary">
                {t("collectionsTitle")}
              </h2>
              <p className="max-w-xl text-text-secondary">{t("collectionsSubtitle")}</p>
            </div>
            <Link
              href="/collections"
              className="hidden shrink-0 items-center gap-1 rounded-sm text-sm font-medium text-brand transition-colors hover:text-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus sm:flex"
            >
              {t("viewAll")}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
          <CollectionGrid collections={collections.slice(0, 3)} locale={locale} />
          {/* Mobile-visible "view all" (the header link is sm+ only) */}
          <Link
            href="/collections"
            className="flex min-h-[44px] items-center justify-center gap-1 rounded-sm text-sm font-medium text-brand transition-colors hover:text-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus sm:hidden"
          >
            {t("viewAll")}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </Container>
    </Section>
  );
}
