"use client";

import { useTranslations } from "next-intl";
import { FileText } from "lucide-react";
import { adminListContent } from "@/features/admin/admin.api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "@/lib/i18n";
import { PageState } from "@/design-system/components/page-state";
import { usePageData } from "@/design-system/hooks/use-page-data";
import type { AdminContent } from "@/features/admin/admin.types";

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive"> = {
  PUBLISHED: "default",
  DRAFT: "secondary",
  ARCHIVED: "destructive",
  SCHEDULED: "outline" as "secondary",
};

export default function AdminContentPage() {
  const t = useTranslations("admin");
  const tc = useTranslations("common");
  const { status, data, reload } = usePageData(() => adminListContent());
  const items = data?.items ?? [];

  const getTitle = (c: AdminContent) =>
    c.translations.find((tr) => tr.locale === "vi")?.title ?? c.type;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold text-text-primary">{t("content")}</h1>
        <Link href="/admin/content/new">
          <Button>{t("createContent")}</Button>
        </Link>
      </div>
      <PageState
        status={status}
        isEmpty={items.length === 0}
        onRetry={reload}
        errorTitle={t("loadErrorTitle")}
        retryLabel={tc("retry")}
        emptyIcon={<FileText className="h-10 w-10" />}
        emptyTitle={t("noContent")}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-default text-left text-text-muted">
                <th className="pb-3 pr-4">{t("contentTitle")}</th>
                <th className="pb-3 pr-4">{t("type")}</th>
                <th className="pb-3 pr-4">{t("status")}</th>
                <th className="pb-3 pr-4">{t("authorName")}</th>
                <th className="pb-3"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((c) => (
                <tr key={c.id} className="border-b border-border-default">
                  <td className="py-3 pr-4 font-medium">{getTitle(c)}</td>
                  <td className="py-3 pr-4 text-xs text-text-muted">{c.type}</td>
                  <td className="py-3 pr-4">
                    <Badge variant={STATUS_VARIANT[c.status] ?? "secondary"}>{c.status}</Badge>
                  </td>
                  <td className="py-3 pr-4 text-sm">{c.author_name ?? "—"}</td>
                  <td className="py-3">
                    <Link href={`/admin/content/${c.id}/edit`}>
                      <Button size="sm" variant="outline">{t("edit")}</Button>
                    </Link>
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
