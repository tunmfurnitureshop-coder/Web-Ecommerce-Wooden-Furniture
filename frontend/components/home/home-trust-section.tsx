import { getTranslations } from "next-intl/server";
import { Section } from "@/design-system/primitives/section";
import { Container } from "@/design-system/primitives/container";
import { Truck, ShieldCheck, Clock, Headphones } from "lucide-react";

const TRUST_ITEMS = [
  { key: "delivery", Icon: Truck },
  { key: "quality", Icon: ShieldCheck },
  { key: "warranty", Icon: Clock },
  { key: "support", Icon: Headphones },
] as const;

/** Detailed "why choose us" reassurance block near the page foot. */
export async function HomeTrustSection() {
  const t = await getTranslations("home");

  return (
    <Section className="bg-surface-subtle">
      <Container>
        <h2 className="mb-10 text-center text-2xl font-bold text-text-primary md:text-3xl">
          {t("trustTitle")}
        </h2>
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
          {TRUST_ITEMS.map(({ key, Icon }) => (
            <div key={key} className="flex flex-col items-center gap-3 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-soft">
                <Icon className="h-6 w-6 text-brand" aria-hidden />
              </div>
              <p className="text-sm font-semibold text-text-primary">{t(`trust.${key}.title`)}</p>
              <p className="text-xs text-text-muted">{t(`trust.${key}.desc`)}</p>
            </div>
          ))}
        </div>
      </Container>
    </Section>
  );
}
