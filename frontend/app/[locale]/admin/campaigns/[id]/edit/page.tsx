"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/lib/i18n";
import { adminGetCampaign, adminPatchCampaign, adminGetCampaignMetrics } from "@/features/admin/admin.api";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { CampaignMetricsCards } from "@/design-system/admin/CampaignMetricsCards";

const STATUSES = ["DRAFT", "ACTIVE", "PAUSED", "ARCHIVED"];

interface PageProps {
  params: { id: string };
}

export default function EditCampaignPage({ params }: PageProps) {
  const t = useTranslations("admin");
  const router = useRouter();
  const { id } = params;

  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [metrics, setMetrics] = useState<Record<string, unknown> | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState("DRAFT");

  useEffect(() => {
    adminGetCampaign(id)
      .then((d) => { setData(d); setStatus(d.status as string); })
      .catch(console.error);
    adminGetCampaignMetrics(id)
      .then(setMetrics)
      .catch(() => {});
  }, [id]);

  async function handlePatch(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await adminPatchCampaign(id, { status });
      router.push("/admin/campaigns");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("saveFailed"));
    } finally {
      setSaving(false);
    }
  }

  if (!data) return <p className="text-text-muted text-sm">{t("loading")}</p>;

  return (
    <div className="max-w-2xl space-y-8">
      <h1 className="text-xl font-bold text-text-primary">{t("editCampaign")}</h1>

      <div className="rounded-lg border border-border-default bg-surface p-5 space-y-2 text-sm">
        <div><span className="text-text-muted">{t("campaignCode")}: </span><span className="font-mono">{data.code as string}</span></div>
        <div><span className="text-text-muted">{t("placement")}: </span>{(data.placement as string) ?? "—"}</div>
      </div>

      {metrics && (
        <div className="space-y-3">
          <h2 className="font-semibold text-text-primary">{t("metrics")}</h2>
          <CampaignMetricsCards
            metrics={metrics as unknown as Parameters<typeof CampaignMetricsCards>[0]["metrics"]}
            labels={{
              productViews: t("productViews"),
              addToCart: t("addToCart"),
              checkoutStarted: t("checkoutStarted"),
              purchaseCompleted: t("purchaseCompleted"),
              revenue: t("campaignRevenue"),
              conversionRate: t("conversionRate"),
            }}
          />
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
          <Button type="button" variant="outline" onClick={() => router.push("/admin/campaigns")}>{t("cancel")}</Button>
        </div>
      </form>
    </div>
  );
}
