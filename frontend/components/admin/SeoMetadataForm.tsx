"use client";

import { useTranslations } from "next-intl";

interface SeoFields {
  metaTitle: string;
  metaDescription: string;
  ogTitle: string;
  ogDescription: string;
  ogImageUrl: string;
}

interface Props {
  value: SeoFields;
  onChange: (value: SeoFields) => void;
}

const COUNTER_STYLE = (len: number, ideal: [number, number], max: number) => {
  if (len > max) return "text-red-500";
  if (len >= ideal[0] && len <= ideal[1]) return "text-green-600";
  return "text-muted-foreground";
};

export function SeoMetadataForm({ value, onChange }: Props) {
  const t = useTranslations("admin");

  const set = (key: keyof SeoFields) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    onChange({ ...value, [key]: e.target.value });
  };

  return (
    <div className="space-y-4 rounded-md border p-4">
      <p className="text-sm font-semibold">{t("seoSection")}</p>
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">
          {t("metaTitle")}
          <span className={`ml-2 text-xs ${COUNTER_STYLE(value.metaTitle.length, [50, 60], 180)}`}>
            {value.metaTitle.length}/180
          </span>
        </label>
        <input
          type="text"
          className="w-full rounded border px-3 py-1.5 text-sm"
          maxLength={180}
          value={value.metaTitle}
          onChange={set("metaTitle")}
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">
          {t("metaDescription")}
          <span className={`ml-2 text-xs ${COUNTER_STYLE(value.metaDescription.length, [140, 160], 320)}`}>
            {value.metaDescription.length}/320
          </span>
        </label>
        <textarea
          className="w-full rounded border px-3 py-1.5 text-sm"
          rows={3}
          maxLength={320}
          value={value.metaDescription}
          onChange={set("metaDescription")}
        />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">{t("ogTitle")}</label>
          <input type="text" className="w-full rounded border px-3 py-1.5 text-sm" value={value.ogTitle} onChange={set("ogTitle")} />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">{t("ogImage")}</label>
          <input type="url" className="w-full rounded border px-3 py-1.5 text-sm" value={value.ogImageUrl} onChange={set("ogImageUrl")} placeholder="https://" />
        </div>
      </div>
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">{t("ogDescription")}</label>
        <textarea className="w-full rounded border px-3 py-1.5 text-sm" rows={2} value={value.ogDescription} onChange={set("ogDescription")} />
      </div>
    </div>
  );
}
