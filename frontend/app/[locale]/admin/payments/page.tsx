"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Receipt } from "lucide-react";
import { getAdminToken } from "@/lib/auth";
import { listAdminPayments } from "@/features/payment/payment.api";
import { PageState } from "@/design-system/components/page-state";
import { usePageData } from "@/design-system/hooks/use-page-data";
import { formatVnd } from "@/lib/format-currency";

const STATUS_COLORS: Record<string, string> = {
  PENDING: "text-warning",
  PAID: "text-success",
  FAILED: "text-danger",
  CANCELLED: "text-text-muted",
  EXPIRED: "text-text-muted",
};

const PAGE_SIZE = 20;

export default function AdminPaymentsPage() {
  const t = useTranslations("admin");
  const tc = useTranslations("common");
  const tStatus = useTranslations("paymentStatus");
  const [page, setPage] = useState(1);
  const { status, data, reload } = usePageData(() =>
    listAdminPayments(getAdminToken() ?? "", { page, pageSize: PAGE_SIZE })
  );

  // Refetch on page change (the hook reads the latest fetcher via ref).
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    reload();
  }, [page, reload]);

  const items = data?.items ?? [];
  const total = data?.total ?? 0;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-text-primary">{t("payments")}</h1>
      <PageState
        status={status}
        isEmpty={items.length === 0}
        onRetry={reload}
        errorTitle={t("loadErrorTitle")}
        retryLabel={tc("retry")}
        emptyIcon={<Receipt className="h-10 w-10" />}
        emptyTitle={t("noPayments")}
      >
        <div className="overflow-x-auto rounded border border-border-default">
          <table className="w-full text-sm">
            <thead className="bg-surface-muted">
              <tr>
                <th className="px-4 py-3 text-left">{t("provider")}</th>
                <th className="px-4 py-3 text-left">{t("status")}</th>
                <th className="px-4 py-3 text-left">{t("amount")}</th>
                <th className="px-4 py-3 text-left">{t("providerTxCode")}</th>
                <th className="px-4 py-3 text-left">{t("createdAt")}</th>
                <th className="px-4 py-3 text-left">{t("paidAt")}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((tx) => (
                <tr key={tx.id} className="border-t border-border-default">
                  <td className="px-4 py-3 font-medium">{tx.provider}</td>
                  <td className={`px-4 py-3 font-medium ${STATUS_COLORS[tx.status] ?? ""}`}>
                    {tStatus(tx.status as never)}
                  </td>
                  <td className="px-4 py-3">{formatVnd(tx.amountVnd)}</td>
                  <td className="px-4 py-3 font-mono text-xs">{tx.providerOrderCode ?? "—"}</td>
                  <td className="px-4 py-3 text-text-muted">{new Date(tx.createdAt).toLocaleString("vi-VN")}</td>
                  <td className="px-4 py-3 text-text-muted">{tx.paidAt ? new Date(tx.paidAt).toLocaleString("vi-VN") : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between text-sm text-text-muted">
          <span>{t("totalCount")}: {total}</span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded border border-border-default px-3 py-1 transition-colors hover:bg-surface-muted disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus"
            >
              {tc("previous")}
            </button>
            <span className="px-3 py-1">{tc("page")} {page}</span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page * PAGE_SIZE >= total}
              className="rounded border border-border-default px-3 py-1 transition-colors hover:bg-surface-muted disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus"
            >
              {tc("next")}
            </button>
          </div>
        </div>
      </PageState>
    </div>
  );
}
