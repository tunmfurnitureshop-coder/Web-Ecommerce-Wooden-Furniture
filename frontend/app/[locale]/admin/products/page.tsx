"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/lib/i18n";
import { Package } from "lucide-react";
import { adminListProducts } from "@/features/admin/admin.api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageState } from "@/design-system/components/page-state";
import { usePageData } from "@/design-system/hooks/use-page-data";
import { formatVnd } from "@/lib/format-currency";

export default function AdminProductsPage() {
  const t = useTranslations("admin");
  const tc = useTranslations("common");
  const { status, data, reload } = usePageData(() => adminListProducts());
  const products = data?.items ?? [];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold text-text-primary">{t("products")}</h1>
        <Link href="/admin/products/new">
          <Button>{t("createProduct")}</Button>
        </Link>
      </div>
      <PageState
        status={status}
        isEmpty={products.length === 0}
        onRetry={reload}
        errorTitle={t("loadErrorTitle")}
        retryLabel={tc("retry")}
        emptyIcon={<Package className="h-10 w-10" />}
        emptyTitle={t("noProducts")}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-default text-left text-text-muted">
                <th className="pb-3 pr-4">{t("sku")}</th>
                <th className="pb-3 pr-4">{t("productName")}</th>
                <th className="pb-3 pr-4">{t("price")}</th>
                <th className="pb-3 pr-4">{t("status")}</th>
                <th className="pb-3 pr-4">{t("totalQty")}</th>
                <th className="pb-3 pr-4">{t("reservedQty")}</th>
                <th className="pb-3 pr-4">{t("availableQty")}</th>
                <th className="pb-3"></th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-b border-border-default">
                  <td className="py-3 pr-4 font-mono text-xs">{p.sku}</td>
                  <td className="py-3 pr-4">{p.nameVi}</td>
                  <td className="py-3 pr-4">{formatVnd(p.basePriceVnd)}</td>
                  <td className="py-3 pr-4">
                    <Badge variant={p.status === "ACTIVE" ? "default" : "secondary"}>{p.status}</Badge>
                  </td>
                  <td className="py-3 pr-4">{p.inventory.totalQty}</td>
                  <td className="py-3 pr-4">{p.inventory.reservedQty}</td>
                  <td className="py-3 pr-4">{p.inventory.availableQty}</td>
                  <td className="py-3">
                    <Link href={`/admin/products/${p.id}/edit`}>
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
