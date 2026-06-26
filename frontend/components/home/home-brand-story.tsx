import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Section } from "@/design-system/primitives/section";
import { Container } from "@/design-system/primitives/container";
import { Button } from "@/design-system/components/button";
import { ArrowRight } from "lucide-react";

/**
 * Editorial brand-story band. Token-driven (no photography) so it renders
 * reliably without shipped image assets while keeping the premium tone.
 */
export async function HomeBrandStory() {
  const t = await getTranslations("home");

  return (
    <Section className="bg-brand-soft">
      <Container>
        <div className="mx-auto flex max-w-2xl flex-col items-center gap-5 text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">
            {t("story.kicker")}
          </span>
          <h2 className="font-display text-3xl font-normal leading-tight text-text-primary md:text-4xl">
            {t("story.title")}
          </h2>
          <p className="text-lg text-text-secondary">{t("story.body")}</p>
          <Link href="/collections" className="mt-2">
            <Button variant="primary" size="lg">
              {t("story.cta")}
              <ArrowRight className="ml-1 h-4 w-4" aria-hidden />
            </Button>
          </Link>
        </div>
      </Container>
    </Section>
  );
}
