"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { adminListCollections } from "@/features/admin/admin.api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "@/lib/i18n";
import type { AdminCollection } from "@/features/admin/admin.types";

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive"> = {
  PUBLISHED: "default",
  DRAFT: "secondary",
  ARCHIVED: "destructive",
};

export default function AdminCollectionsPage() {
  const t = useTranslations("admin");
  const [collections, setCollections] = useState<AdminCollection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminListCollections()
      .then((r) => setCollections(r.items))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const getName = (col: AdminCollection) =>
    col.translations.find((tr) => tr.locale === "vi")?.name ?? col.code;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">{t("collections")}</h1>
        <Link href="/admin/collections/new">
          <Button>{t("createCollection")}</Button>
        </Link>
      </div>
      {loading ? (
        <p className="text-sm text-muted-foreground">Đang tải...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="pb-3 pr-4">Code</th>
                <th className="pb-3 pr-4">Tên (vi)</th>
                <th className="pb-3 pr-4">Trạng thái</th>
                <th className="pb-3 pr-4">Sản phẩm</th>
                <th className="pb-3 pr-4">Nổi bật</th>
                <th className="pb-3"></th>
              </tr>
            </thead>
            <tbody>
              {collections.map((col) => (
                <tr key={col.id} className="border-b">
                  <td className="py-3 pr-4 font-mono text-xs">{col.code}</td>
                  <td className="py-3 pr-4">{getName(col)}</td>
                  <td className="py-3 pr-4">
                    <Badge variant={STATUS_VARIANT[col.status] ?? "secondary"}>{col.status}</Badge>
                  </td>
                  <td className="py-3 pr-4">{col.products.length}</td>
                  <td className="py-3 pr-4">{col.is_featured ? "✓" : ""}</td>
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
      )}
    </div>
  );
}
