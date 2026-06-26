"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { api } from "@/lib/api";
import { getAuthHeaders } from "@/lib/auth";
import type { AdminReviewOut, AdminReviewListResponse } from "@/features/review/review.types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MessageSquare } from "lucide-react";
import { PageState, type PageStatus } from "@/design-system/components/page-state";

type ReviewStatus = "ALL" | "PENDING" | "APPROVED" | "REJECTED" | "HIDDEN";

const NEXT_ACTIONS: Record<string, { action: string; label: string }[]> = {
  PENDING: [{ action: "APPROVED", label: "approve" }, { action: "REJECTED", label: "reject" }],
  APPROVED: [{ action: "HIDDEN", label: "hide" }],
  HIDDEN: [{ action: "APPROVED", label: "restore" }],
  REJECTED: [],
};

export default function AdminReviewsPage() {
  const t = useTranslations("adminReviews");
  const tAdmin = useTranslations("admin");
  const tc = useTranslations("common");
  const tStatus = useTranslations("reviewStatus");
  const [statusFilter, setStatusFilter] = useState<ReviewStatus>("PENDING");
  const [reviews, setReviews] = useState<AdminReviewOut[]>([]);
  const [pageStatus, setPageStatus] = useState<PageStatus>("loading");
  const [flash, setFlash] = useState("");

  async function fetchReviews(status: ReviewStatus) {
    setPageStatus("loading");
    try {
      const params = new URLSearchParams({ page: "1", pageSize: "20" });
      if (status !== "ALL") params.set("status", status);
      const data = await api.get<AdminReviewListResponse>(
        `/api/v1/admin/reviews?${params}`,
        getAuthHeaders()
      );
      setReviews(data.items);
      setPageStatus("ready");
    } catch {
      setPageStatus("error");
    }
  }

  useEffect(() => { fetchReviews(statusFilter); }, [statusFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  async function updateStatus(reviewId: string, newStatus: string) {
    try {
      await api.patch(
        `/api/v1/admin/reviews/${reviewId}/status`,
        { status: newStatus },
        getAuthHeaders()
      );
      setFlash(t("updateSuccess"));
      fetchReviews(statusFilter);
    } catch {
      setFlash(t("updateError"));
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-xl font-bold text-text-primary">{t("title")}</h1>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as ReviewStatus)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">{t("all")}</SelectItem>
            <SelectItem value="PENDING">{tStatus("PENDING")}</SelectItem>
            <SelectItem value="APPROVED">{tStatus("APPROVED")}</SelectItem>
            <SelectItem value="REJECTED">{tStatus("REJECTED")}</SelectItem>
            <SelectItem value="HIDDEN">{tStatus("HIDDEN")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {flash && (
        <p className="rounded bg-info-bg px-3 py-2 text-sm text-info" role="status">{flash}</p>
      )}

      <PageState
        status={pageStatus}
        isEmpty={reviews.length === 0}
        onRetry={() => fetchReviews(statusFilter)}
        errorTitle={tAdmin("loadErrorTitle")}
        retryLabel={tc("retry")}
        emptyIcon={<MessageSquare className="h-10 w-10" />}
        emptyTitle={t("empty")}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-default text-left text-text-muted">
                <th className="pb-3 pr-4 font-medium">{t("customer")}</th>
                <th className="pb-3 pr-4 font-medium">{t("product")}</th>
                <th className="pb-3 pr-4 font-medium">{t("rating")}</th>
                <th className="pb-3 pr-4 font-medium">{t("content")}</th>
                <th className="pb-3 pr-4 font-medium">{t("status")}</th>
                <th className="pb-3 pr-4 font-medium">{t("date")}</th>
                <th className="pb-3 font-medium">{t("actions")}</th>
              </tr>
            </thead>
            <tbody>
              {reviews.map((r) => (
                <tr key={r.id} className="border-b border-border-default align-top">
                  <td className="py-3 pr-4">{r.customerName}</td>
                  <td className="py-3 pr-4 max-w-[140px] truncate">{r.productName}</td>
                  <td className="py-3 pr-4">
                    <span aria-label={`${r.rating}/5`}>{"★".repeat(r.rating)}</span>
                  </td>
                  <td className="py-3 pr-4 max-w-[200px]">
                    {r.title && <p className="font-medium truncate">{r.title}</p>}
                    {r.content && (
                      <p className="line-clamp-2 text-xs text-text-muted">{r.content}</p>
                    )}
                  </td>
                  <td className="py-3 pr-4">
                    <Badge variant="outline">{tStatus(r.status)}</Badge>
                  </td>
                  <td className="py-3 pr-4 whitespace-nowrap text-xs text-text-muted">
                    {new Date(r.createdAt).toLocaleDateString("vi-VN")}
                  </td>
                  <td className="py-3">
                    <div className="flex flex-wrap gap-1">
                      {(NEXT_ACTIONS[r.status] ?? []).map(({ action, label }) => (
                        <Button
                          key={action}
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          onClick={() => updateStatus(r.id, action)}
                        >
                          {t(label as Parameters<typeof t>[0])}
                        </Button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </PageState>
    </div>
  );
}
