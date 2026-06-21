"use client";

import { useState } from "react";
import { useRouter } from "@/lib/i18n";
import { useTranslations } from "next-intl";
import { adminCreateTag } from "@/features/admin/admin.api";
import { Button } from "@/components/ui/button";

const TAG_TYPES = ["STYLE","MATERIAL","ROOM","USAGE","CAPACITY","PRICE_TIER","FEATURE","AVAILABILITY"];
const LOCALES = ["vi", "zh-CN"];

export default function NewTagPage() {
  const t = useTranslations("admin");
  const router = useRouter();
  const [code, setCode] = useState("");
  const [type, setType] = useState("MATERIAL");
  const [sortOrder, setSortOrder] = useState(0);
  const [translations, setTranslations] = useState<Record<string, { name: string; slug: string; description: string }>>({
    vi: { name: "", slug: "", description: "" },
    "zh-CN": { name: "", slug: "", description: "" },
  });
  const [saving, setSaving] = useState(false);

  const setTr = (locale: string, key: string, val: string) => {
    setTranslations((prev) => ({ ...prev, [locale]: { ...prev[locale], [key]: val } }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await adminCreateTag({
        code, type, sort_order: sortOrder,
        translations: LOCALES
          .filter((l) => translations[l].name)
          .map((l) => ({ locale: l, ...translations[l] })),
      });
      router.push("/admin/tags");
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-bold mb-6">{t("createTag")}</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-sm font-medium">{t("tagCode")}</label>
            <input className="w-full rounded border px-3 py-1.5 text-sm font-mono uppercase" required value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">{t("tagType")}</label>
            <select className="w-full rounded border px-3 py-1.5 text-sm" value={type} onChange={(e) => setType(e.target.value)}>
              {TAG_TYPES.map((tp) => <option key={tp} value={tp}>{tp}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">{t("sortOrder")}</label>
            <input type="number" className="w-full rounded border px-3 py-1.5 text-sm" value={sortOrder} onChange={(e) => setSortOrder(Number(e.target.value))} />
          </div>
        </div>
        {LOCALES.map((locale) => (
          <div key={locale} className="space-y-3 rounded-md border p-4">
            <p className="text-sm font-semibold uppercase">{locale}{locale === "vi" && " *"}</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Tên</label>
                <input required={locale === "vi"} className="w-full rounded border px-3 py-1.5 text-sm" value={translations[locale].name} onChange={(e) => setTr(locale, "name", e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Slug</label>
                <input required={locale === "vi"} className="w-full rounded border px-3 py-1.5 text-sm font-mono" value={translations[locale].slug} onChange={(e) => setTr(locale, "slug", e.target.value)} />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Mô tả</label>
              <input className="w-full rounded border px-3 py-1.5 text-sm" value={translations[locale].description} onChange={(e) => setTr(locale, "description", e.target.value)} />
            </div>
          </div>
        ))}
        <div className="flex gap-3">
          <Button type="submit" disabled={saving}>{saving ? t("saving") : t("createTag")}</Button>
          <Button type="button" variant="outline" onClick={() => router.push("/admin/tags")}>Hủy</Button>
        </div>
      </form>
    </div>
  );
}
