"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { SeoMetadataForm } from "./SeoMetadataForm";
import { Button } from "@/components/ui/button";
import type { AdminCollection, CreateCollectionRequest } from "@/features/admin/admin.types";

const LOCALES = ["vi", "zh-CN"];
const STATUSES = ["DRAFT", "PUBLISHED", "ARCHIVED"];
const STATUS_LABEL: Record<string, string> = {
  DRAFT: "statusDraft",
  PUBLISHED: "statusPublished",
  ARCHIVED: "statusArchived",
};

// Backend requires lowercase snake_case matching ^[a-z][a-z0-9_]*$
const sanitizeCode = (v: string) =>
  v.toLowerCase().replace(/[^a-z0-9_]+/g, "_").replace(/^[^a-z]+/, "");

interface CollectionTr {
  name: string; slug: string; shortDescription: string; descriptionMarkdown: string;
  seo: { metaTitle: string; metaDescription: string; ogTitle: string; ogDescription: string; ogImageUrl: string };
}

const emptyTr = (): CollectionTr => ({
  name: "", slug: "", shortDescription: "", descriptionMarkdown: "",
  seo: { metaTitle: "", metaDescription: "", ogTitle: "", ogDescription: "", ogImageUrl: "" },
});

interface Props {
  initial?: AdminCollection;
  onSave: (data: CreateCollectionRequest) => Promise<void>;
  saving: boolean;
}

export function CollectionForm({ initial, onSave, saving }: Props) {
  const t = useTranslations("admin");
  const [code, setCode] = useState(initial?.code ?? "");
  const [status, setStatus] = useState(initial?.status ?? "DRAFT");
  const [featured, setFeatured] = useState(initial?.is_featured ?? false);
  const [coverUrl, setCoverUrl] = useState(initial?.cover_image_url ?? "");
  const [translations, setTranslations] = useState<Record<string, CollectionTr>>(() => {
    const init: Record<string, CollectionTr> = {};
    for (const l of LOCALES) {
      const tr = initial?.translations.find((t) => t.locale === l);
      init[l] = tr ? {
        name: tr.name, slug: tr.slug, shortDescription: tr.short_description ?? "",
        descriptionMarkdown: tr.description_markdown ?? "",
        seo: { metaTitle: tr.meta_title ?? "", metaDescription: tr.meta_description ?? "",
               ogTitle: tr.og_title ?? "", ogDescription: tr.og_description ?? "",
               ogImageUrl: tr.og_image_url ?? "" },
      } : emptyTr();
    }
    return init;
  });

  const setTr = (locale: string, key: keyof CollectionTr, val: string) => {
    setTranslations((prev) => ({ ...prev, [locale]: { ...prev[locale], [key]: val } }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave({
      code, status, is_featured: featured,
      cover_image_url: coverUrl || undefined,
      translations: LOCALES
        .filter((l) => translations[l].name)
        .map((l) => ({
          locale: l,
          name: translations[l].name,
          slug: translations[l].slug,
          short_description: translations[l].shortDescription || undefined,
          description_markdown: translations[l].descriptionMarkdown || undefined,
          meta_title: translations[l].seo.metaTitle || undefined,
          meta_description: translations[l].seo.metaDescription || undefined,
          og_title: translations[l].seo.ogTitle || undefined,
          og_description: translations[l].seo.ogDescription || undefined,
          og_image_url: translations[l].seo.ogImageUrl || undefined,
        })),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-sm font-medium">{t("code")}</label>
          <input required className="w-full rounded border px-3 py-1.5 text-sm font-mono lowercase" value={code} onChange={(e) => setCode(sanitizeCode(e.target.value))} readOnly={!!initial} placeholder={t("codePlaceholder")} />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">{t("status")}</label>
          <select className="w-full rounded border px-3 py-1.5 text-sm" value={status} onChange={(e) => setStatus(e.target.value)}>
            {STATUSES.map((s) => <option key={s} value={s}>{t(STATUS_LABEL[s])}</option>)}
          </select>
        </div>
        <div className="space-y-1 col-span-2">
          <label className="text-sm font-medium">{t("coverImageUrl")}</label>
          <input type="url" className="w-full rounded border px-3 py-1.5 text-sm" value={coverUrl} onChange={(e) => setCoverUrl(e.target.value)} placeholder="https://" />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} />
          {t("featured")}
        </label>
      </div>
      {LOCALES.map((locale) => (
        <div key={locale} className="space-y-4 rounded-md border p-4">
          <p className="text-sm font-semibold">{t("translationsSection")} — {locale}{locale === "vi" && " *"}</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-text-muted">{t("name")}</label>
              <input required={locale === "vi"} className="w-full rounded border px-3 py-1.5 text-sm" value={translations[locale].name} onChange={(e) => setTr(locale, "name", e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-text-muted">{t("slug")}</label>
              <input required={locale === "vi"} className="w-full rounded border px-3 py-1.5 text-sm font-mono" value={translations[locale].slug} onChange={(e) => setTr(locale, "slug", e.target.value)} />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-text-muted">{t("shortDescription")}</label>
            <input className="w-full rounded border px-3 py-1.5 text-sm" value={translations[locale].shortDescription} onChange={(e) => setTr(locale, "shortDescription", e.target.value)} />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-text-muted">{t("descriptionMarkdown")}</label>
            <textarea rows={5} className="w-full rounded border px-3 py-1.5 text-sm font-mono" value={translations[locale].descriptionMarkdown} onChange={(e) => setTr(locale, "descriptionMarkdown", e.target.value)} />
          </div>
          <SeoMetadataForm value={translations[locale].seo} onChange={(seo) => setTranslations((prev) => ({ ...prev, [locale]: { ...prev[locale], seo } }))} />
        </div>
      ))}
      <Button type="submit" disabled={saving}>{saving ? t("saving") : t("saveCollection")}</Button>
    </form>
  );
}
