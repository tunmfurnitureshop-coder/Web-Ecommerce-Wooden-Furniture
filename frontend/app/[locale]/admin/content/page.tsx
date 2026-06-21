"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { adminListContent } from "@/features/admin/admin.api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "@/lib/i18n";
import type { AdminContent } from "@/features/admin/admin.types";

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive"> = {
  PUBLISHED: "default",
  DRAFT: "secondary",
  ARCHIVED: "destructive",
  SCHEDULED: "outline" as "secondary",
};

export default function AdminContentPage() {
  const t = useTranslations("admin");
  const [items, setItems] = useState<AdminContent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminListContent()
      .then((r) => setItems(r.items))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const getTitle = (c: AdminContent) =>
    c.translations.find((tr) => tr.locale === "vi")?.title ?? c.type;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">{t("content")}</h1>
        <Link href="/admin/content/new">
          <Button>{t("createContent")}</Button>
        </Link>
      </div>
      {loading ? (
        <p className="text-sm text-muted-foreground">Đang tải...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="pb-3 pr-4">Tiêu đề</th>
                <th className="pb-3 pr-4">Loại</th>
                <th className="pb-3 pr-4">Trạng thái</th>
                <th className="pb-3 pr-4">Tác giả</th>
                <th className="pb-3"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((c) => (
                <tr key={c.id} className="border-b">
                  <td className="py-3 pr-4 font-medium">{getTitle(c)}</td>
                  <td className="py-3 pr-4 text-xs text-muted-foreground">{c.type}</td>
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
      )}
    </div>
  );
}
