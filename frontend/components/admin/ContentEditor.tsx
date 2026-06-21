"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { SeoMetadataForm } from "./SeoMetadataForm";
import { MarkdownRenderer } from "@/design-system/content/markdown-renderer";
import { Button } from "@/components/ui/button";
import type { AdminContent, CreateContentRequest } from "@/features/admin/admin.types";

const LOCALES = ["vi", "zh-CN"];
const CONTENT_TYPES = ["BUYING_GUIDE","MATERIAL_GUIDE","STYLE_GUIDE","CARE_GUIDE","HOW_TO"];
const STATUSES = ["DRAFT","SCHEDULED","PUBLISHED","ARCHIVED"];

interface ContentTr {
  title: string; slug: string; excerpt: string; bodyMarkdown: string;
  seo: { metaTitle: string; metaDescription: string; ogTitle: string; ogDescription: string; ogImageUrl: string };
}
const emptyTr = (): ContentTr => ({
  title: "", slug: "", excerpt: "", bodyMarkdown: "",
  seo: { metaTitle: "", metaDescription: "", ogTitle: "", ogDescription: "", ogImageUrl: "" },
});

interface Props {
  initial?: AdminContent;
  onSave: (data: CreateContentRequest) => Promise<void>;
  saving: boolean;
}

export function ContentEditor({ initial, onSave, saving }: Props) {
  const t = useTranslations("admin");
  const [type, setType] = useState(initial?.type ?? "BUYING_GUIDE");
  const [status, setStatus] = useState(initial?.status ?? "DRAFT");
  const [coverUrl, setCoverUrl] = useState(initial?.cover_image_url ?? "");
  const [authorName, setAuthorName] = useState(initial?.author_name ?? "");
  const [scheduledAt, setScheduledAt] = useState(initial?.scheduled_at ?? "");
  const [activeTab, setActiveTab] = useState("vi");
  const [preview, setPreview] = useState(false);
  const [translations, setTranslations] = useState<Record<string, ContentTr>>(() => {
    const init: Record<string, ContentTr> = {};
    for (const l of LOCALES) {
      const tr = initial?.translations.find((tr) => tr.locale === l);
      init[l] = tr ? {
        title: tr.title, slug: tr.slug, excerpt: tr.excerpt ?? "",
        bodyMarkdown: tr.body_markdown ?? "",
        seo: { metaTitle: tr.meta_title ?? "", metaDescription: tr.meta_description ?? "",
               ogTitle: tr.og_title ?? "", ogDescription: tr.og_description ?? "",
               ogImageUrl: tr.og_image_url ?? "" },
      } : emptyTr();
    }
    return init;
  });

  const setTr = <K extends keyof ContentTr>(locale: string, key: K, val: ContentTr[K]) => {
    setTranslations((prev) => ({ ...prev, [locale]: { ...prev[locale], [key]: val } }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave({
      type, status,
      cover_image_url: coverUrl || undefined,
      author_name: authorName || undefined,
      scheduled_at: scheduledAt || undefined,
      translations: LOCALES
        .filter((l) => translations[l].title)
        .map((l) => ({
          locale: l, title: translations[l].title, slug: translations[l].slug,
          excerpt: translations[l].excerpt || undefined,
          body_markdown: translations[l].bodyMarkdown || undefined,
          meta_title: translations[l].seo.metaTitle || undefined,
          meta_description: translations[l].seo.metaDescription || undefined,
          og_title: translations[l].seo.ogTitle || undefined,
          og_description: translations[l].seo.ogDescription || undefined,
          og_image_url: translations[l].seo.ogImageUrl || undefined,
        })),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-5xl">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="space-y-1">
          <label className="text-sm font-medium">Loại</label>
          <select className="w-full rounded border px-3 py-1.5 text-sm" value={type} onChange={(e) => setType(e.target.value)}>
            {CONTENT_TYPES.map((ct) => <option key={ct} value={ct}>{ct}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Trạng thái</label>
          <select className="w-full rounded border px-3 py-1.5 text-sm" value={status} onChange={(e) => setStatus(e.target.value)}>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">{t("authorName")}</label>
          <input className="w-full rounded border px-3 py-1.5 text-sm" value={authorName} onChange={(e) => setAuthorName(e.target.value)} />
        </div>
        {status === "SCHEDULED" && (
          <div className="space-y-1">
            <label className="text-sm font-medium">{t("scheduledAt")}</label>
            <input type="datetime-local" className="w-full rounded border px-3 py-1.5 text-sm" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} />
          </div>
        )}
        <div className="space-y-1 col-span-2">
          <label className="text-sm font-medium">Cover Image URL</label>
          <input type="url" className="w-full rounded border px-3 py-1.5 text-sm" value={coverUrl} onChange={(e) => setCoverUrl(e.target.value)} placeholder="https://" />
        </div>
      </div>

      <div className="flex gap-2 border-b">
        {LOCALES.map((l) => (
          <button key={l} type="button" onClick={() => setActiveTab(l)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${activeTab === l ? "border-primary text-primary" : "border-transparent text-muted-foreground"}`}>
            {l}{l === "vi" && " *"}
          </button>
        ))}
      </div>

      {LOCALES.filter((l) => l === activeTab).map((locale) => (
        <div key={locale} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Tiêu đề</label>
              <input required={locale === "vi"} className="w-full rounded border px-3 py-1.5 text-sm" value={translations[locale].title} onChange={(e) => setTr(locale, "title", e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Slug</label>
              <input required={locale === "vi"} className="w-full rounded border px-3 py-1.5 text-sm font-mono" value={translations[locale].slug} onChange={(e) => setTr(locale, "slug", e.target.value)} />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Tóm tắt</label>
            <textarea rows={2} className="w-full rounded border px-3 py-1.5 text-sm" value={translations[locale].excerpt} onChange={(e) => setTr(locale, "excerpt", e.target.value)} />
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs text-muted-foreground">{t("bodyMarkdown")}</label>
              <button type="button" className="text-xs text-primary" onClick={() => setPreview((p) => !p)}>
                {preview ? "Soạn thảo" : t("preview")}
              </button>
            </div>
            {preview ? (
              <div className="min-h-[300px] rounded border p-4 bg-surface-subtle overflow-auto">
                <MarkdownRenderer content={translations[locale].bodyMarkdown} />
              </div>
            ) : (
              <textarea rows={16} className="w-full rounded border px-3 py-1.5 text-sm font-mono" value={translations[locale].bodyMarkdown} onChange={(e) => setTr(locale, "bodyMarkdown", e.target.value)} />
            )}
          </div>
          <SeoMetadataForm value={translations[locale].seo} onChange={(seo) => setTr(locale, "seo", seo)} />
        </div>
      ))}

      <Button type="submit" disabled={saving}>{saving ? t("saving") : t("saveContent")}</Button>
    </form>
  );
}
