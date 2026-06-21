"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useCustomerAuth } from "@/components/customer/CustomerAuthContext";
import { api } from "@/lib/api";
import type { ProductReviewsResponse } from "@/features/review/review.types";
import { ReviewSummary } from "./ReviewSummary";
import { ReviewList } from "./ReviewList";
import { ReviewForm } from "./ReviewForm";
import { Separator } from "@/components/ui/separator";

interface Props {
  productId: string;
  locale: string;
}

export function ProductReviewsSection({ productId, locale }: Props) {
  const t = useTranslations("reviews");
  const { isAuthenticated } = useCustomerAuth();
  const [data, setData] = useState<ProductReviewsResponse | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api
      .get<ProductReviewsResponse>(
        `/api/v1/products/${productId}/reviews?page=${page}&pageSize=5&locale=${locale}`
      )
      .then((res) => { if (!cancelled) setData(res); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [productId, page, locale]);

  function handleReviewSubmitted() {
    setPage(1);
  }

  return (
    <div className="mt-10 space-y-6">
      <Separator />
      <h2 className="text-xl font-semibold">{t("title")}</h2>

      {data && (
        <>
          <ReviewSummary summary={data.summary} />
          <ReviewList
            items={data.items}
            total={data.total}
            page={page}
            pageSize={data.pageSize}
            loading={loading}
            onPageChange={setPage}
          />
        </>
      )}

      {isAuthenticated ? (
        <ReviewForm productId={productId} onSuccess={handleReviewSubmitted} />
      ) : (
        <p className="text-sm text-muted-foreground italic">{t("loginToReview")}</p>
      )}
    </div>
  );
}
