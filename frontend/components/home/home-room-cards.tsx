import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Section } from "@/design-system/primitives/section";
import { Container } from "@/design-system/primitives/container";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

// No room photos ship in /public, so each card is a warm tonal panel driven
// entirely by semantic tokens — robust, on-brand, and zero broken images.
const ROOMS = [
  { slug: "living_room", surface: "bg-brand-soft" },
  { slug: "bedroom", surface: "bg-surface-muted" },
  { slug: "dining_room", surface: "bg-surface-subtle" },
] as const;

/** "Mua theo không gian" — tonal room cards linking into the filtered catalog. */
export async function HomeRoomCards() {
  const t = await getTranslations("home");

  return (
    <Section className="bg-background">
      <Container>
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-2">
            <h2 className="font-display text-3xl md:text-4xl font-normal text-text-primary">
              {t("browseByRoom")}
            </h2>
            <p className="max-w-xl text-text-secondary">{t("browseByRoomSubtitle")}</p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 md:gap-6">
            {ROOMS.map(({ slug, surface }) => (
              <Link
                key={slug}
                href={`/products?room=${slug}`}
                className={cn(
                  "group relative flex h-52 flex-col justify-end overflow-hidden rounded-xl border border-border-default p-6 transition-all duration-200 hover:border-border-strong hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus md:h-64",
                  surface
                )}
              >
                <span className="flex items-center gap-2">
                  <span className="font-display text-2xl font-normal text-text-primary">
                    {t(`categories.${slug}`)}
                  </span>
                  <ArrowUpRight
                    className="h-5 w-5 text-brand transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 motion-reduce:transform-none"
                    aria-hidden
                  />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </Container>
    </Section>
  );
}
