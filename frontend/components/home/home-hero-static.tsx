import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Button } from "@/design-system/components/button";
import { ArrowRight } from "lucide-react";

/**
 * Static fallback hero shown when there are no active HOME_HERO campaigns.
 * Server Component — reads the `home` namespace directly.
 */
export async function HomeHeroStatic() {
  const t = await getTranslations("home");

  return (
    <section className="relative overflow-hidden bg-surface-muted min-h-[520px] flex items-center">
      <div className="mx-auto max-w-container px-4 md:px-8 xl:px-12 py-20 md:py-28">
        <div className="max-w-xl flex flex-col gap-6">
          <h2 className="font-display text-4xl md:text-5xl font-normal text-text-primary leading-tight">
            {t("heroTitle")}
          </h2>
          <p className="text-lg text-text-secondary">{t("heroSubtitle")}</p>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <Link href="/products">
              <Button variant="primary" size="lg">
                {t("heroCtaShop")}
                <ArrowRight className="h-4 w-4 ml-1" aria-hidden />
              </Button>
            </Link>
            <Link href="/products?sort=rating_desc">
              <Button variant="outline" size="lg">
                {t("heroCtaCollection")}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
