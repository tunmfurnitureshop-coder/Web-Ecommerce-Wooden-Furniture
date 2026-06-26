import { getTranslations, getLocale } from "next-intl/server";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { Section } from "@/design-system/primitives/section";
import { Container } from "@/design-system/primitives/container";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { getRooms } from "@/features/room/room.api";

// Tonal fallbacks cycle when a room has no admin-configured image — keeps the
// rail on-brand and free of broken images.
const FALLBACK_SURFACES = ["bg-brand-soft", "bg-surface-muted", "bg-surface-subtle"];

/** "Mua theo không gian" — room cards (admin-configurable images) linking into
 * the filtered catalog. Data-driven from /rooms; hides itself when empty. */
export async function HomeRoomCards() {
  const t = await getTranslations("home");
  const locale = await getLocale();

  let rooms;
  try {
    rooms = (await getRooms(locale)).items;
  } catch {
    return null;
  }
  if (rooms.length === 0) return null;

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
          <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-3 md:gap-6 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {rooms.map((room, i) => (
              <Link
                key={room.code}
                href={`/products?room=${room.code}`}
                className={cn(
                  "group relative flex h-52 w-[78%] shrink-0 snap-start flex-col justify-end overflow-hidden rounded-xl border border-border-default p-6 transition-all duration-200 hover:border-border-strong hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus sm:w-[46%] md:h-64 lg:w-[31%]",
                  !room.imageUrl && FALLBACK_SURFACES[i % FALLBACK_SURFACES.length]
                )}
              >
                {room.imageUrl && (
                  <>
                    <Image
                      src={room.imageUrl}
                      alt={room.name}
                      fill
                      sizes="(max-width: 640px) 100vw, 33vw"
                      className="object-cover transition-transform duration-300 group-hover:scale-105 motion-reduce:transform-none"
                    />
                    <div
                      className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent"
                      aria-hidden
                    />
                  </>
                )}
                <span className="relative flex items-center gap-2">
                  <span
                    className={cn(
                      "font-display text-2xl font-normal",
                      room.imageUrl ? "text-text-inverse" : "text-text-primary"
                    )}
                  >
                    {room.name}
                  </span>
                  <ArrowUpRight
                    className={cn(
                      "h-5 w-5 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 motion-reduce:transform-none",
                      room.imageUrl ? "text-text-inverse" : "text-brand"
                    )}
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
