"use client";

import { useTranslations } from "next-intl";
import { Tags } from "lucide-react";
import { adminListTags, adminUpdateTag, adminDeleteTag } from "@/features/admin/admin.api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "@/lib/i18n";
import { PageState } from "@/design-system/components/page-state";
import { usePageData } from "@/design-system/hooks/use-page-data";
import type { AdminTag } from "@/features/admin/admin.types";

// Mapped to semantic tones (tones may repeat — correctness over unique hues).
const TAG_TYPE_COLORS: Record<string, string> = {
  STYLE: "bg-brand-soft text-brand",
  MATERIAL: "bg-warning-bg text-warning",
  ROOM: "bg-info-bg text-info",
  USAGE: "bg-success-bg text-success",
  CAPACITY: "bg-warning-bg text-warning",
  PRICE_TIER: "bg-danger-bg text-danger",
  FEATURE: "bg-info-bg text-info",
  AVAILABILITY: "bg-surface-muted text-text-secondary",
};

const TAG_TYPE_FALLBACK = "bg-surface-muted text-text-secondary";

export default function AdminTagsPage() {
  const t = useTranslations("admin");
  const tCommon = useTranslations("common");
  const { status, data, reload } = usePageData(() => adminListTags());
  const tags = data?.items ?? [];

  const toggleActive = async (tag: AdminTag) => {
    await adminUpdateTag(tag.id, { is_active: !tag.is_active });
    reload();
  };

  const remove = async (tag: AdminTag) => {
    if (!confirm(t("confirmDeleteTag", { code: tag.code }))) return;
    await adminDeleteTag(tag.id).catch(() => {});
    reload();
  };

  const getName = (tag: AdminTag) =>
    tag.translations.find((tr) => tr.locale === "vi")?.name ?? tag.code;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold text-text-primary">{t("tags")}</h1>
        <Link href="/admin/tags/new">
          <Button>{t("createTag")}</Button>
        </Link>
      </div>
      <PageState
        status={status}
        isEmpty={tags.length === 0}
        onRetry={reload}
        errorTitle={t("loadErrorTitle")}
        retryLabel={tCommon("retry")}
        emptyIcon={<Tags className="h-10 w-10" />}
        emptyTitle={t("noTags")}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-default text-left text-text-muted">
                <th className="pb-3 pr-4">{t("tagCode")}</th>
                <th className="pb-3 pr-4">{t("name")}</th>
                <th className="pb-3 pr-4">{t("tagType")}</th>
                <th className="pb-3 pr-4">{t("status")}</th>
                <th className="pb-3"></th>
              </tr>
            </thead>
            <tbody>
              {tags.map((tag) => (
                <tr key={tag.id} className="border-b border-border-default">
                  <td className="py-3 pr-4 font-mono text-xs">{tag.code}</td>
                  <td className="py-3 pr-4">{getName(tag)}</td>
                  <td className="py-3 pr-4">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${TAG_TYPE_COLORS[tag.type] ?? TAG_TYPE_FALLBACK}`}>
                      {tag.type}
                    </span>
                  </td>
                  <td className="py-3 pr-4">
                    <Badge variant={tag.is_active ? "default" : "secondary"}>
                      {tag.is_active ? t("tagActive") : t("tagInactive")}
                    </Badge>
                  </td>
                  <td className="py-3 flex gap-2">
                    <Link href={`/admin/tags/${tag.id}/edit`}>
                      <Button size="sm" variant="outline">{t("edit")}</Button>
                    </Link>
                    <Button size="sm" variant="ghost" onClick={() => toggleActive(tag)}>
                      {tag.is_active ? t("tagInactive") : t("tagActive")}
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => remove(tag)}>
                      {tCommon("delete")}
                    </Button>
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
