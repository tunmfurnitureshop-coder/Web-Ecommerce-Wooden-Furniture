"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/lib/i18n";
import { adminCreatePromotion } from "@/features/admin/admin.api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toUtcIso } from "@/lib/datetime";

const TRIGGERS = ["AUTOMATIC", "COUPON"];
const DISCOUNT_TYPES = ["PERCENTAGE", "FIXED_AMOUNT"];
const SCOPE_TYPES = ["CART", "PRODUCT", "CATEGORY", "COLLECTION"];
const STATUSES = ["DRAFT", "ACTIVE", "PAUSED"];

export default function NewPromotionPage() {
  const t = useTranslations("admin");
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    code: "",
    trigger: "COUPON",
    scopeType: "CART",
    status: "DRAFT",
    discountType: "PERCENTAGE",
    discountPercentageBps: "",
    discountAmountVnd: "",
    maxDiscountVnd: "",
    minOrderValueVnd: "",
    priority: "100",
    startsAt: "",
    endsAt: "",
    nameVi: "",
    nameZh: "",
  });

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const translations: Record<string, unknown> = {};
      if (form.nameVi) translations["vi"] = { name: form.nameVi };
      if (form.nameZh) translations["zh-CN"] = { name: form.nameZh };

      await adminCreatePromotion({
        code: form.code || null,
        trigger: form.trigger,
        scopeType: form.scopeType,
        status: form.status,
        discountType: form.discountType,
        discountPercentageBps: form.discountPercentageBps ? parseInt(form.discountPercentageBps) : null,
        discountAmountVnd: form.discountAmountVnd ? parseInt(form.discountAmountVnd) : null,
        maxDiscountVnd: form.maxDiscountVnd ? parseInt(form.maxDiscountVnd) : null,
        minOrderValueVnd: form.minOrderValueVnd ? parseInt(form.minOrderValueVnd) : null,
        priority: parseInt(form.priority) || 100,
        startsAt: toUtcIso(form.startsAt),
        endsAt: toUtcIso(form.endsAt),
        translations,
      });
      router.push("/admin/promotions");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("saveFailed"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-bold text-text-primary mb-6">{t("createPromotion")}</h1>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>{t("promoCode")}</Label>
            <Input placeholder="SUMMER20" value={form.code} onChange={(e) => set("code", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>{t("trigger")}</Label>
            <select value={form.trigger} onChange={(e) => set("trigger", e.target.value)} className="w-full rounded-md border border-border-default bg-surface px-3 py-2 text-sm">
              {TRIGGERS.map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label>{t("scopeType")}</Label>
            <select value={form.scopeType} onChange={(e) => set("scopeType", e.target.value)} className="w-full rounded-md border border-border-default bg-surface px-3 py-2 text-sm">
              {SCOPE_TYPES.map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label>{t("status")}</Label>
            <select value={form.status} onChange={(e) => set("status", e.target.value)} className="w-full rounded-md border border-border-default bg-surface px-3 py-2 text-sm">
              {STATUSES.map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label>{t("discountType")}</Label>
            <select value={form.discountType} onChange={(e) => set("discountType", e.target.value)} className="w-full rounded-md border border-border-default bg-surface px-3 py-2 text-sm">
              {DISCOUNT_TYPES.map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label>{t("discountPercentageBps")}</Label>
            <Input type="number" placeholder="1000 = 10%" value={form.discountPercentageBps} onChange={(e) => set("discountPercentageBps", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>{t("discountAmountVnd")}</Label>
            <Input type="number" value={form.discountAmountVnd} onChange={(e) => set("discountAmountVnd", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>{t("maxDiscountVnd")}</Label>
            <Input type="number" value={form.maxDiscountVnd} onChange={(e) => set("maxDiscountVnd", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>{t("minOrderValueVnd")}</Label>
            <Input type="number" value={form.minOrderValueVnd} onChange={(e) => set("minOrderValueVnd", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>{t("priority")}</Label>
            <Input type="number" value={form.priority} onChange={(e) => set("priority", e.target.value)} />
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
            <Input value={form.nameVi} onChange={(e) => set("nameVi", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>{t("nameZh")}</Label>
            <Input value={form.nameZh} onChange={(e) => set("nameZh", e.target.value)} />
          </div>
        </div>

        {error && <p className="text-danger text-sm">{error}</p>}

        <div className="flex gap-3">
          <Button type="submit" disabled={saving}>{saving ? t("saving") : t("savePromotion")}</Button>
          <Button type="button" variant="outline" onClick={() => router.push("/admin/promotions")}>{t("cancel")}</Button>
        </div>
      </form>
    </div>
  );
}
