import { getTranslations } from "next-intl/server";
import { Container } from "@/design-system/primitives/container";
import { Truck, BadgeCheck, ShieldCheck, Headphones } from "lucide-react";

const USP_ITEMS = [
  { key: "delivery", Icon: Truck },
  { key: "quality", Icon: BadgeCheck },
  { key: "warranty", Icon: ShieldCheck },
  { key: "support", Icon: Headphones },
] as const;

/**
 * Slim service-promise band shown directly under the hero. Reuses the
 * `trust.*.title` strings — reassurance above the fold without duplicating copy.
 */
export async function HomeUspStrip() {
  const t = await getTranslations("home");

  return (
    <section aria-label={t("uspBarAria")} className="border-y border-border-default bg-surface-subtle">
      <Container>
        <ul className="grid grid-cols-2 gap-x-6 gap-y-4 py-5 sm:grid-cols-4">
          {USP_ITEMS.map(({ key, Icon }) => (
            <li key={key} className="flex items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-soft">
                <Icon className="h-5 w-5 text-brand" aria-hidden />
              </span>
              <span className="text-sm font-medium text-text-primary">{t(`trust.${key}.title`)}</span>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
