"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { uploadAdminImage } from "@/features/media/media.api";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface Props {
  label: string;
  value: string;
  onChange: (url: string) => void;
  prefix?: string;
}

/** Reusable admin image upload field: preview + upload/replace/remove. Stores the
 * resulting URL via onChange so it works in both create and edit forms. */
export function ImageUploadField({ label, value, onChange, prefix = "uploads" }: Props) {
  const t = useTranslations("admin");
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [failed, setFailed] = useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setFailed(false);
    try {
      const { url } = await uploadAdminImage(file, prefix);
      onChange(url);
    } catch {
      setFailed(true);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <div className="flex items-start gap-3">
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={value}
            alt={label}
            className="h-20 w-32 rounded border border-border-default object-cover"
          />
        ) : (
          <div className="flex h-20 w-32 items-center justify-center rounded border border-dashed border-border-default text-xs text-text-muted">
            {t("noImage")}
          </div>
        )}
        <div className="flex flex-col gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? t("uploadingImage") : value ? t("replaceImage") : t("uploadImage")}
          </Button>
          {value && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onChange("")}
              disabled={uploading}
            >
              {t("removeImage")}
            </Button>
          )}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleFile}
        />
      </div>
      {failed && <p className="text-danger text-xs">{t("uploadFailed")}</p>}
    </div>
  );
}
