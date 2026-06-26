import { getTranslations } from "next-intl/server";
import { Tag } from "lucide-react";
import { formatCurrency } from "@/lib/format-currency";
import type { CampaignBanner } from "@/features/product/product.types";

/** Promo banner shown above the catalog grid when the PLP is scoped to a
 * campaign. Discount label is formatted here (i18n) from structured API data. */
export async function CampaignBannerCard({
  banner,
  locale,
}: {
  banner: CampaignBanner;
  locale: string;
}) {
  const t = await getTranslations("catalog");

  const discountLabel =
    banner.badgeLabel ??
    (banner.discountType === "PERCENTAGE" && banner.discountPercentBps != null
      ? t("campaignDiscountPercent", { percent: banner.discountPercentBps / 100 })
      : banner.discountType === "FIXED_AMOUNT" && banner.discountAmountVnd != null
        ? t("campaignDiscountAmount", { amount: formatCurrency(banner.discountAmountVnd) })
        : null);

  const endsOn = banner.endsAt
    ? new Intl.DateTimeFormat(locale, { day: "2-digit", month: "2-digit", year: "numeric" }).format(
        new Date(banner.endsAt),
      )
    : null;

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-border-default bg-brand-soft px-5 py-4">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand">
        <Tag className="h-4 w-4 text-text-inverse" aria-hidden />
      </span>
      <span className="font-display text-lg text-text-primary">{banner.campaignName}</span>
      {discountLabel && (
        <span className="font-semibold text-brand">{discountLabel}</span>
      )}
      {endsOn && (
        <span className="text-sm text-text-muted">{t("campaignEndsOn", { date: endsOn })}</span>
      )}
    </div>
  );
}
