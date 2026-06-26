import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { BUSINESS_CONFIG, telHref } from "@/lib/business-config";
import { MapsEmbed } from "@/components/contact/maps-embed";
import { Container } from "@/design-system/primitives/container";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("contact_page");
  return {
    title: `${t("title")} | ${BUSINESS_CONFIG.name}`,
    description: t("subtitle"),
  };
}

export default async function ContactPage() {
  const t = await getTranslations("contact_page");
  const { address, telephone, email, mapsEmbedUrl, mapsDirectionsUrl } = BUSINESS_CONFIG;
  const [weekday, saturday] = BUSINESS_CONFIG.openingHours;

  return (
    <Container>
      <div className="py-12 md:py-16">
        <h1 className="text-3xl font-display font-semibold text-text-primary mb-2">
          {t("title")}
        </h1>
        <p className="text-text-secondary mb-10">{t("subtitle")}</p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="flex flex-col gap-8">
            <section>
              <h2 className="text-sm font-semibold text-text-primary uppercase tracking-wide mb-3">
                {t("address_section")}
              </h2>
              <address className="not-italic text-text-secondary text-sm leading-relaxed">
                <p>{BUSINESS_CONFIG.name}</p>
                {address.streetAddress && <p>{address.streetAddress}</p>}
                {(address.addressLocality || address.addressRegion) && (
                  <p>
                    {[address.addressLocality, address.addressRegion]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                )}
              </address>
              {mapsDirectionsUrl && (
                <a
                  href={mapsDirectionsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 mt-3 text-sm text-brand hover:underline"
                >
                  {t("directions_cta")} ↗
                </a>
              )}
            </section>

            <section>
              <h2 className="text-sm font-semibold text-text-primary uppercase tracking-wide mb-3">
                {t("hours_section")}
              </h2>
              <dl className="text-sm text-text-secondary space-y-1">
                <div className="flex justify-between">
                  <dt>{t("hours_weekday")}</dt>
                  <dd>{weekday.opens} – {weekday.closes}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>{t("hours_saturday")}</dt>
                  <dd>{saturday.opens} – {saturday.closes}</dd>
                </div>
              </dl>
              <p className="text-sm text-text-muted mt-1">{t("hours_closed")}</p>
            </section>

            <section className="flex flex-col gap-2">
              <a href={telHref(telephone)} className="text-sm text-brand hover:underline">
                {t("call_cta")}: {telephone}
              </a>
              <a href={`mailto:${email}`} className="text-sm text-brand hover:underline">
                {t("email_cta")}: {email}
              </a>
            </section>
          </div>

          {mapsEmbedUrl && <MapsEmbed src={mapsEmbedUrl} title={t("map_title")} />}
        </div>
      </div>
    </Container>
  );
}
