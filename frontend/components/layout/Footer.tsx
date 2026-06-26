import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { TreePine } from "lucide-react";
import { Divider } from "@/design-system/primitives/divider";
import { ContactChannelButton } from "@/components/contact/contact-channel-button";
import { getContactChannels } from "@/lib/contact/channels";
import { BUSINESS_CONFIG } from "@/lib/business-config";

export function Footer() {
  const t = useTranslations("footer");
  const tc = useTranslations("contact");
  const contactChannels = getContactChannels();

  return (
    <footer className="border-t border-border-default bg-surface">
      <div className="mx-auto max-w-container px-4 md:px-8 xl:px-12 py-12">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-4">
          <div className="flex flex-col gap-3 md:col-span-1">
            <Link
              href="/"
              className="flex items-center gap-2 font-bold text-base text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus rounded-sm"
            >
              <TreePine className="h-5 w-5 text-brand" aria-hidden />
              <span className="font-display">Vin Furniture</span>
            </Link>
            <p className="text-sm text-text-muted max-w-xs">{t("tagline")}</p>
          </div>

          <div className="flex flex-col gap-3">
            <p className="text-sm font-semibold text-text-primary">{t("sections.products")}</p>
            <nav className="flex flex-col gap-2">
              {(["living_room", "bedroom", "dining_room", "outdoor"] as const).map((room) => (
                <Link
                  key={room}
                  href={`/products?room=${room}`}
                  className="text-sm text-text-muted hover:text-text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus rounded-sm"
                >
                  {t(`rooms.${room}`)}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex flex-col gap-3">
            <p className="text-sm font-semibold text-text-primary">{t("sections.account")}</p>
            <nav className="flex flex-col gap-2">
              {(["profile", "orders", "wishlist", "addresses"] as const).map((key) => (
                <Link
                  key={key}
                  href={`/account/${key}`}
                  className="text-sm text-text-muted hover:text-text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus rounded-sm"
                >
                  {t(`accountLinks.${key}`)}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex flex-col gap-3">
            <p className="text-sm font-semibold text-text-primary">{t("sections.support")}</p>
            <div className="flex flex-col gap-2 text-sm text-text-muted">
              <a
                href={`mailto:${BUSINESS_CONFIG.email}`}
                className="hover:text-text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus rounded-sm"
              >
                {BUSINESS_CONFIG.email}
              </a>
              <p>{BUSINESS_CONFIG.telephone}</p>
              {BUSINESS_CONFIG.address.streetAddress && (
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-medium text-text-primary">{t("address.label")}</span>
                  <address className="not-italic text-sm text-text-muted leading-snug">
                    {BUSINESS_CONFIG.address.streetAddress},<br />
                    {BUSINESS_CONFIG.address.addressLocality}
                  </address>
                  {BUSINESS_CONFIG.mapsDirectionsUrl && (
                    <a
                      href={BUSINESS_CONFIG.mapsDirectionsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-brand hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus rounded-sm"
                    >
                      {t("address.link_text")} ↗
                    </a>
                  )}
                </div>
              )}
              <Link
                href="/lien-he"
                className="hover:text-text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus rounded-sm"
              >
                {t("sections.contact_us")}
              </Link>
              {contactChannels.map((channel) => (
                <ContactChannelButton
                  key={channel.id}
                  channel={channel}
                  label={tc(`channels.${channel.id}`)}
                  variant="inline"
                />
              ))}
            </div>
          </div>
        </div>

        <Divider className="my-8" />
        <p className="text-xs text-text-muted text-center">
          {t("copyright", { year: new Date().getFullYear() })}
        </p>
      </div>
    </footer>
  );
}
