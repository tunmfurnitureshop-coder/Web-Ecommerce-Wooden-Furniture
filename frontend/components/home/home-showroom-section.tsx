import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Section } from "@/design-system/primitives/section";
import { Container } from "@/design-system/primitives/container";
import { Button } from "@/design-system/components/button";
import { MapsEmbed } from "@/components/contact/maps-embed";
import { BUSINESS_CONFIG } from "@/lib/business-config";
import { ArrowRight, MapPin } from "lucide-react";

/**
 * Homepage showroom band — address teaser + Google Maps embed. Renders only
 * when a Maps embed URL is configured, so the heavy iframe is scoped to the
 * homepage (not the global footer).
 */
export async function HomeShowroomSection() {
  const { address, mapsEmbedUrl, mapsDirectionsUrl } = BUSINESS_CONFIG;
  if (!mapsEmbedUrl) return null;

  const t = await getTranslations("home");
  const locality = [address.addressLocality, address.addressRegion]
    .filter(Boolean)
    .join(", ");

  return (
    <Section className="bg-surface-muted">
      <Container>
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
          <div className="flex flex-col gap-5">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-brand">
              {t("showroom.kicker")}
            </span>
            <h2 className="font-display text-3xl font-normal leading-tight text-text-primary md:text-4xl">
              {t("showroom.title")}
            </h2>
            <p className="text-lg text-text-secondary">{t("showroom.subtitle")}</p>

            {(address.streetAddress || locality) && (
              <address className="flex items-start gap-2 not-italic text-text-secondary">
                <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-brand" aria-hidden />
                <span className="leading-relaxed">
                  {address.streetAddress && <>{address.streetAddress}<br /></>}
                  {locality}
                </span>
              </address>
            )}

            <div className="mt-2 flex flex-wrap items-center gap-4">
              <Link href="/lien-he">
                <Button variant="primary" size="lg">
                  {t("showroom.contact_cta")}
                  <ArrowRight className="ml-1 h-4 w-4" aria-hidden />
                </Button>
              </Link>
              {mapsDirectionsUrl && (
                <a
                  href={mapsDirectionsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-[44px] items-center rounded-sm text-sm font-medium text-brand transition-colors hover:text-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus"
                >
                  {t("showroom.directions_cta")} ↗
                </a>
              )}
            </div>
          </div>

          <MapsEmbed src={mapsEmbedUrl} title={t("showroom.map_title")} />
        </div>
      </Container>
    </Section>
  );
}
