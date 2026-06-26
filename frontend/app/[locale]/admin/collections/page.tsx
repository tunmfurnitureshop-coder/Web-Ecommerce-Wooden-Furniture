"use client";

import { useTranslations } from "next-intl";
import { Check, Layers } from "lucide-react";
import { adminListCollections } from "@/features/admin/admin.api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "@/lib/i18n";
import { PageState } from "@/design-system/components/page-state";
import { usePageData } from "@/design-system/hooks/use-page-data";
import type { AdminCollection } from "@/features/admin/admin.types";

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive"> = {
  PUBLISHED: "default",
  DRAFT: "secondary",
  ARCHIVED: "destructive",
};

export default function AdminCollectionsPage() {
  const t = useTranslations("admin");
  const tc = useTranslations("common");
  const { status, data, reload } = usePageData(() => adminListCollections());
  const collections = data?.items ?? [];

  const getName = (col: AdminCollection) =>
    col.translations.find((tr) => tr.locale === "vi")?.name ?? col.code;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold text-text-primary">{t("collections")}</h1>
        <Link href="/admin/collections/new">
          <Button>{t("createCollection")}</Button>
        </Link>
      </div>
      <PageState
        status={status}
        isEmpty={collections.length === 0}
        onRetry={reload}
        errorTitle={t("loadErrorTitle")}
        retryLabel={tc("retry")}
        emptyIcon={<Layers className="h-10 w-10" />}
        emptyTitle={t("noCollections")}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-default text-left text-text-muted">
                <th className="pb-3 pr-4">{t("code")}</th>
                <th className="pb-3 pr-4">{t("name")}</th>
                <th className="pb-3 pr-4">{t("status")}</th>
                <th className="pb-3 pr-4">{t("products")}</th>
                <th className="pb-3 pr-4">{t("featured")}</th>
                <th className="pb-3"></th>
              </tr>
            </thead>
            <tbody>
              {collections.map((col) => (
                <tr key={col.id} className="border-b border-border-default">
                  <td className="py-3 pr-4 font-mono text-xs">{col.code}</td>
                  <td className="py-3 pr-4">{getName(col)}</td>
                  <td className="py-3 pr-4">
                    <Badge variant={STATUS_VARIANT[col.status] ?? "secondary"}>{col.status}</Badge>
                  </td>
                  <td className="py-3 pr-4">{col.products.length}</td>
                  <td className="py-3 pr-4">
                    {col.is_featured && <Check className="h-4 w-4 text-success" aria-label={t("featured")} />}
                  </td>
                  <td className="py-3">
                    <Link href={`/admin/collections/${col.id}/edit`}>
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
