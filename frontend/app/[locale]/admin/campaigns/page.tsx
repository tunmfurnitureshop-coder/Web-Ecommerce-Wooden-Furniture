"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/lib/i18n";
import { adminListCampaigns, adminDeleteCampaign } from "@/features/admin/admin.api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface CampaignBrief {
  id: string;
  code: string;
  status: string;
  placement: string | null;
  startsAt: string;
  endsAt: string | null;
  createdAt: string;
}

export default function AdminCampaignsPage() {
  const t = useTranslations("admin");
  const [items, setItems] = useState<CampaignBrief[]>([]);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    adminListCampaigns()
      .then((r) => setItems(r.items as CampaignBrief[]))
      .catch(console.error)
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function handleDelete(id: string) {
    if (!confirm(t("deleteConfirm"))) return;
    await adminDeleteCampaign(id).catch(console.error);
    load();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-text-primary">{t("campaigns")}</h1>
        <Link href="/admin/campaigns/new">
          <Button>{t("createCampaign")}</Button>
        </Link>
      </div>

      {loading ? (
        <p className="text-text-muted text-sm">{t("loading")}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-default text-left text-text-muted">
                <th className="pb-3 pr-4">{t("campaignCode")}</th>
                <th className="pb-3 pr-4">{t("status")}</th>
                <th className="pb-3 pr-4">{t("placement")}</th>
                <th className="pb-3 pr-4">{t("startsAt")}</th>
                <th className="pb-3 pr-4">{t("endsAt")}</th>
                <th className="pb-3"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((c) => (
                <tr key={c.id} className="border-b border-border-default">
                  <td className="py-3 pr-4 font-mono text-xs">{c.code}</td>
                  <td className="py-3 pr-4">
                    <Badge variant={c.status === "ACTIVE" ? "default" : "secondary"}>{c.status}</Badge>
                  </td>
                  <td className="py-3 pr-4">{c.placement ?? "—"}</td>
                  <td className="py-3 pr-4 text-xs">{c.startsAt?.slice(0, 10)}</td>
                  <td className="py-3 pr-4 text-xs">{c.endsAt?.slice(0, 10) ?? "—"}</td>
                  <td className="py-3 flex gap-2">
                    <Link href={`/admin/campaigns/${c.id}/edit`}>
                      <Button size="sm" variant="outline">{t("edit")}</Button>
                    </Link>
                    <Button size="sm" variant="outline" onClick={() => handleDelete(c.id)}>
                      {t("delete")}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {items.length === 0 && (
            <p className="py-8 text-center text-text-muted text-sm">{t("noCampaigns")}</p>
          )}
        </div>
      )}
    </div>
  );
}
