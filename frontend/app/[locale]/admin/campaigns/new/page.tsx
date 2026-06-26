"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/lib/i18n";
import { adminCreateCampaign } from "@/features/admin/admin.api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImageUploadField } from "@/components/admin/image-upload-field";
import { toUtcIso } from "@/lib/datetime";

const STATUSES = ["DRAFT", "ACTIVE", "PAUSED"];
const PLACEMENTS = ["", "HOME_HERO", "HOME_SECTION", "COLLECTION_SECTION", "PRODUCT_PAGE", "CART", "CHECKOUT"];

export default function NewCampaignPage() {
  const t = useTranslations("admin");
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    code: "",
    status: "DRAFT",
    placement: "",
    displayPriority: "100",
    heroImageUrl: "",
    mobileHeroImageUrl: "",
    startsAt: "",
    endsAt: "",
    nameVi: "",
    slugVi: "",
    nameZh: "",
    slugZh: "",
  });

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const translations = [
        ...(form.nameVi ? [{ locale: "vi", name: form.nameVi, slug: form.slugVi }] : []),
        ...(form.nameZh ? [{ locale: "zh-CN", name: form.nameZh, slug: form.slugZh }] : []),
      ];
      await adminCreateCampaign({
        code: form.code,
        status: form.status,
        placement: form.placement || null,
        displayPriority: parseInt(form.displayPriority) || 100,
        heroImageUrl: form.heroImageUrl || null,
        mobileHeroImageUrl: form.mobileHeroImageUrl || null,
        startsAt: toUtcIso(form.startsAt),
        endsAt: toUtcIso(form.endsAt),
        translations,
      });
      router.push("/admin/campaigns");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("saveFailed"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-bold text-text-primary mb-6">{t("createCampaign")}</h1>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>{t("campaignCode")}</Label>
            <Input placeholder="SUMMER2026" value={form.code} onChange={(e) => set("code", e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label>{t("status")}</Label>
            <select value={form.status} onChange={(e) => set("status", e.target.value)} className="w-full rounded-md border border-border-default bg-surface px-3 py-2 text-sm">
              {STATUSES.map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label>{t("placement")}</Label>
            <select value={form.placement} onChange={(e) => set("placement", e.target.value)} className="w-full rounded-md border border-border-default bg-surface px-3 py-2 text-sm">
              {PLACEMENTS.map((v) => <option key={v} value={v}>{v || "—"}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label>{t("priority")}</Label>
            <Input type="number" value={form.displayPriority} onChange={(e) => set("displayPriority", e.target.value)} />
          </div>
          <div className="col-span-2">
            <ImageUploadField label={t("heroImageUrl")} value={form.heroImageUrl} onChange={(url) => set("heroImageUrl", url)} prefix="campaigns" />
          </div>
          <div className="col-span-2">
            <ImageUploadField label={t("mobileHeroImageUrl")} value={form.mobileHeroImageUrl} onChange={(url) => set("mobileHeroImageUrl", url)} prefix="campaigns" />
          </div>
          <div className="space-y-1.5">
            <Label>{t("startsAt")}</Label>
            <Input type="datetime-local" value={form.startsAt} onChange={(e) => set("startsAt", e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label>{t("endsAt")}</Label>
            <Input type="datetime-local" value={form.endsAt} onChange={(e) => set("endsAt", e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>{t("nameVi")}</Label>
            <Input value={form.nameVi} onChange={(e) => set("nameVi", e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label>Slug (vi)</Label>
            <Input placeholder="mua-sam-he-2026" value={form.slugVi} onChange={(e) => set("slugVi", e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label>{t("nameZh")}</Label>
            <Input value={form.nameZh} onChange={(e) => set("nameZh", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Slug (zh-CN)</Label>
            <Input value={form.slugZh} onChange={(e) => set("slugZh", e.target.value)} />
          </div>
        </div>

        {error && <p className="text-danger text-sm">{error}</p>}

        <div className="flex gap-3">
          <Button type="submit" disabled={saving}>{saving ? t("saving") : t("saveCampaign")}</Button>
          <Button type="button" variant="outline" onClick={() => router.push("/admin/campaigns")}>{t("cancel")}</Button>
        </div>
      </form>
    </div>
  );
}
