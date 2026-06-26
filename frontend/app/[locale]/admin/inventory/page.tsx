"use client";

import { useTranslations } from "next-intl";
import { Boxes } from "lucide-react";
import { InventoryTable } from "@/components/admin/InventoryTable";
import { adminListInventory } from "@/features/admin/admin.api";
import { PageState } from "@/design-system/components/page-state";
import { usePageData } from "@/design-system/hooks/use-page-data";

export default function AdminInventoryPage() {
  const t = useTranslations("admin");
  const tc = useTranslations("common");
  const { status, data, reload } = usePageData(() => adminListInventory());
  const items = data?.items ?? [];

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold text-text-primary">{t("inventory")}</h1>
      <PageState
        status={status}
        isEmpty={items.length === 0}
        onRetry={reload}
        errorTitle={t("loadErrorTitle")}
        retryLabel={tc("retry")}
        emptyIcon={<Boxes className="h-10 w-10" />}
        emptyTitle={t("noInventory")}
      >
        <InventoryTable items={items} onSaved={reload} />
      </PageState>
    </div>
  );
}
