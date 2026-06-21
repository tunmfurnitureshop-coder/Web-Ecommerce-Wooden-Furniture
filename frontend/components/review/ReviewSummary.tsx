"use client";

import { useTranslations } from "next-intl";
import { RatingStars } from "./RatingStars";
import type { ReviewSummaryOut } from "@/features/review/review.types";

interface ReviewSummaryProps {
  summary: ReviewSummaryOut;
}

export function ReviewSummary({ summary }: ReviewSummaryProps) {
  const t = useTranslations("reviews");

  if (summary.reviewCount === 0) {
    return <p className="text-muted-foreground text-sm">{t("noReviews")}</p>;
  }

  return (
    <div className="flex flex-col sm:flex-row gap-6 p-4 bg-muted/30 rounded-lg">
      <div className="flex flex-col items-center gap-1 min-w-[80px]">
        <span className="text-4xl font-bold">{summary.averageRating.toFixed(1)}</span>
        <RatingStars value={Math.round(summary.averageRating)} readonly size="sm" />
        <span className="text-xs text-muted-foreground">
          {summary.reviewCount} {t("count")}
        </span>
      </div>

      <div className="flex-1 space-y-1.5">
        {[5, 4, 3, 2, 1].map((star) => {
          const count = summary.distribution[String(star)] ?? 0;
          const pct = summary.reviewCount > 0 ? (count / summary.reviewCount) * 100 : 0;
          return (
            <div key={star} className="flex items-center gap-2 text-xs">
              <span className="w-3 text-right">{star}</span>
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-yellow-400 rounded-full transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="w-5 text-muted-foreground">{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
