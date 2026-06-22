"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/lib/i18n";
import { adminListPromotions, adminDeletePromotion } from "@/features/admin/admin.api";
import { Button } from "@/components/ui/button";
import { PromotionStatusBadge } from "@/design-system/admin/PromotionStatusBadge";

interface PromotionBrief {
  id: string;
  code: string | null;
  trigger: string;
  scopeType: string;
  status: string;
  discountType: string;
  discountPercentageBps: number | null;
  discountAmountVnd: number | null;
  startsAt: string;
  endsAt: string | null;
}

export default function AdminPromotionsPage() {
  const t = useTranslations("admin");
  const [items, setItems] = useState<PromotionBrief[]>([]);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    adminListPromotions()
      .then((r) => setItems(r.items as PromotionBrief[]))
      .catch(console.error)
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function handleDelete(id: string) {
    if (!confirm(t("deleteConfirm"))) return;
    await adminDeletePromotion(id).catch(console.error);
    load();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-text-primary">{t("promotions")}</h1>
        <Link href="/admin/promotions/new">
          <Button>{t("createPromotion")}</Button>
        </Link>
      </div>

      {loading ? (
        <p className="text-text-muted text-sm">{t("loading")}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-default text-left text-text-muted">
                <th className="pb-3 pr-4">{t("promoCode")}</th>
                <th className="pb-3 pr-4">{t("trigger")}</th>
                <th className="pb-3 pr-4">{t("discountType")}</th>
                <th className="pb-3 pr-4">{t("status")}</th>
                <th className="pb-3 pr-4">{t("startsAt")}</th>
                <th className="pb-3 pr-4">{t("endsAt")}</th>
                <th className="pb-3"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((p) => (
                <tr key={p.id} className="border-b border-border-default">
                  <td className="py-3 pr-4 font-mono text-xs">{p.code ?? "—"}</td>
                  <td className="py-3 pr-4">{p.trigger}</td>
                  <td className="py-3 pr-4">{p.discountType}</td>
                  <td className="py-3 pr-4">
                    <PromotionStatusBadge status={p.status} />
                  </td>
                  <td className="py-3 pr-4 text-xs">{p.startsAt?.slice(0, 10)}</td>
                  <td className="py-3 pr-4 text-xs">{p.endsAt?.slice(0, 10) ?? "—"}</td>
                  <td className="py-3 flex gap-2">
                    <Link href={`/admin/promotions/${p.id}/edit`}>
                      <Button size="sm" variant="outline">{t("edit")}</Button>
                    </Link>
                    <Button size="sm" variant="outline" onClick={() => handleDelete(p.id)}>
                      {t("delete")}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {items.length === 0 && (
            <p className="py-8 text-center text-text-muted text-sm">{t("noPromotions")}</p>
          )}
        </div>
      )}
    </div>
  );
}
