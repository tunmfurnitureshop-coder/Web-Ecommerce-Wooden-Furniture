"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { getDashboardSummary } from "@/features/admin/admin.api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatVnd } from "@/lib/format-currency";
import type { DashboardSummary } from "@/features/admin/admin.types";

export default function DashboardPage() {
  const t = useTranslations("admin");
  const [data, setData] = useState<DashboardSummary | null>(null);

  useEffect(() => {
    getDashboardSummary().then(setData).catch(console.error);
  }, []);

  const stats = data
    ? [
        { label: t("totalOrders"), value: data.totalOrders },
        { label: t("totalRevenue"), value: formatVnd(data.totalRevenueVnd) },
        { label: t("pendingOrders"), value: data.pendingOrders },
        { label: t("paidOrders"), value: data.paidOrders },
        { label: t("lowStock"), value: data.lowStockProducts },
      ]
    : [];

  return (
    <div>
      <h1 className="text-xl font-bold mb-6">{t("dashboard")}</h1>
      {!data ? (
        <p className="text-muted-foreground">Đang tải...</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {stats.map((s) => (
            <Card key={s.label}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{s.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
