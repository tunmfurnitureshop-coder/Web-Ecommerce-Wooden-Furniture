"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { adminListTags, adminUpdateTag, adminDeleteTag } from "@/features/admin/admin.api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "@/lib/i18n";
import type { AdminTag } from "@/features/admin/admin.types";

const TAG_TYPE_COLORS: Record<string, string> = {
  STYLE: "bg-purple-100 text-purple-800",
  MATERIAL: "bg-amber-100 text-amber-800",
  ROOM: "bg-blue-100 text-blue-800",
  USAGE: "bg-green-100 text-green-800",
  CAPACITY: "bg-orange-100 text-orange-800",
  PRICE_TIER: "bg-red-100 text-red-800",
  FEATURE: "bg-cyan-100 text-cyan-800",
  AVAILABILITY: "bg-gray-100 text-gray-800",
};

export default function AdminTagsPage() {
  const t = useTranslations("admin");
  const [tags, setTags] = useState<AdminTag[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    adminListTags()
      .then((r) => setTags(r.items))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const toggleActive = async (tag: AdminTag) => {
    await adminUpdateTag(tag.id, { is_active: !tag.is_active });
    load();
  };

  const remove = async (tag: AdminTag) => {
    if (!confirm(`Delete tag "${tag.code}"?`)) return;
    await adminDeleteTag(tag.id).catch(console.error);
    load();
  };

  const getName = (tag: AdminTag) =>
    tag.translations.find((t) => t.locale === "vi")?.name ?? tag.code;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">{t("tags")}</h1>
        <Link href="/admin/tags/new">
          <Button>{t("createTag")}</Button>
        </Link>
      </div>
      {loading ? (
        <p className="text-sm text-muted-foreground">{t("loading", { ns: "common" }) ?? "Đang tải..."}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="pb-3 pr-4">{t("tagCode")}</th>
                <th className="pb-3 pr-4">Tên (vi)</th>
                <th className="pb-3 pr-4">{t("tagType")}</th>
                <th className="pb-3 pr-4">Trạng thái</th>
                <th className="pb-3"></th>
              </tr>
            </thead>
            <tbody>
              {tags.map((tag) => (
                <tr key={tag.id} className="border-b">
                  <td className="py-3 pr-4 font-mono text-xs">{tag.code}</td>
                  <td className="py-3 pr-4">{getName(tag)}</td>
                  <td className="py-3 pr-4">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${TAG_TYPE_COLORS[tag.type] ?? "bg-gray-100 text-gray-800"}`}>
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
                      {t("delete", { ns: "common" }) ?? "Xóa"}
                    </Button>
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
