"use client";

import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RatingStars } from "./RatingStars";
import type { ReviewOut } from "@/features/review/review.types";

interface ReviewListProps {
  items: ReviewOut[];
  total: number;
  page: number;
  pageSize: number;
  loading?: boolean;
  onPageChange: (page: number) => void;
}

export function ReviewList({ items, total, page, pageSize, loading, onPageChange }: ReviewListProps) {
  const t = useTranslations("reviews");
  const tCommon = useTranslations("common");
  const totalPages = Math.ceil(total / pageSize);

  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">{t("noReviews")}</p>;
  }

  return (
    <div className="space-y-4">
      {loading && <p className="text-sm text-muted-foreground">{tCommon("loading")}</p>}

      {items.map((review) => (
        <div key={review.id} className="space-y-1 pb-4 border-b last:border-0">
          <div className="flex items-center gap-2 flex-wrap">
            <RatingStars value={review.rating} readonly size="sm" />
            {review.isVerifiedPurchase && (
              <Badge variant="secondary" className="text-xs py-0">
                {t("verifiedPurchase")}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium">{review.customerName}</span>
            <span className="text-muted-foreground text-xs">
              {new Date(review.createdAt).toLocaleDateString("vi-VN")}
            </span>
          </div>
          {review.title && <p className="font-medium text-sm">{review.title}</p>}
          {review.content && <p className="text-sm text-muted-foreground">{review.content}</p>}
        </div>
      ))}

      {totalPages > 1 && (
        <div className="flex items-center gap-2 text-sm pt-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 1 || loading}
            onClick={() => onPageChange(page - 1)}
          >
            {tCommon("previous")}
          </Button>
          <span className="text-muted-foreground">
            {tCommon("page")} {page} {tCommon("of")} {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages || loading}
            onClick={() => onPageChange(page + 1)}
          >
            {tCommon("next")}
          </Button>
        </div>
      )}
    </div>
  );
}
