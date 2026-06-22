"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/lib/i18n";
import { adminGetPromotion, adminPatchPromotion, adminGetPromotionMetrics } from "@/features/admin/admin.api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PromotionStatusBadge } from "@/design-system/admin/PromotionStatusBadge";

const STATUSES = ["DRAFT", "ACTIVE", "PAUSED", "EXPIRED"];

interface PageProps {
  params: { id: string };
}

export default function EditPromotionPage({ params }: PageProps) {
  const t = useTranslations("admin");
  const router = useRouter();
  const { id } = params;

  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [metrics, setMetrics] = useState<Record<string, unknown> | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState("DRAFT");

  useEffect(() => {
    adminGetPromotion(id)
      .then((d) => { setData(d); setStatus(d.status as string); })
      .catch(console.error);
    adminGetPromotionMetrics(id)
      .then(setMetrics)
      .catch(() => {});
  }, [id]);

  async function handlePatch(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await adminPatchPromotion(id, { status });
      router.push("/admin/promotions");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("saveFailed"));
    } finally {
      setSaving(false);
    }
  }

  if (!data) return <p className="text-text-muted text-sm">{t("loading")}</p>;

  return (
    <div className="max-w-2xl space-y-8">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-bold text-text-primary">{t("editPromotion")}</h1>
        <PromotionStatusBadge status={data.status as string} />
      </div>

      <div className="rounded-lg border border-border-default bg-surface p-5 space-y-3 text-sm">
        <div className="grid grid-cols-2 gap-3">
          <div><span className="text-text-muted">{t("promoCode")}: </span><span className="font-mono">{(data.code as string) ?? "—"}</span></div>
          <div><span className="text-text-muted">{t("trigger")}: </span>{data.trigger as string}</div>
          <div><span className="text-text-muted">{t("discountType")}: </span>{data.discountType as string}</div>
          <div><span className="text-text-muted">{t("priority")}: </span>{data.priority as number}</div>
        </div>
      </div>

      {metrics && (
        <div className="rounded-lg border border-border-default bg-surface p-5 space-y-3">
          <h2 className="font-semibold text-text-primary">{t("metrics")}</h2>
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div><p className="text-text-muted text-xs">{t("usageRedeemed")}</p><p className="font-bold">{metrics.usageRedeemed as number}</p></div>
            <div><p className="text-text-muted text-xs">{t("usageReserved")}</p><p className="font-bold">{metrics.usageReserved as number}</p></div>
            <div><p className="text-text-muted text-xs">{t("discountTotalVnd")}</p><p className="font-bold">{(metrics.discountTotalVnd as number)?.toLocaleString()} ₫</p></div>
          </div>
        </div>
      )}

      <form onSubmit={handlePatch} className="space-y-4">
        <div className="space-y-1.5">
          <Label>{t("status")}</Label>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-md border border-border-default bg-surface px-3 py-2 text-sm">
            {STATUSES.map((v) => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>

        {error && <p className="text-danger text-sm">{error}</p>}

        <div className="flex gap-3">
          <Button type="submit" disabled={saving}>{saving ? t("saving") : t("save")}</Button>
          <Button type="button" variant="outline" onClick={() => router.push("/admin/promotions")}>{t("cancel")}</Button>
        </div>
      </form>
    </div>
  );
}
