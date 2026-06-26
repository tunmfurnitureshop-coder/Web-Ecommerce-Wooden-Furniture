"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  CalendarDays,
  TrendingUp,
  ShoppingCart,
  Wallet,
  Clock,
  CheckCircle2,
  XCircle,
  PackageX,
  CreditCard,
} from "lucide-react";
import { getDashboardSummary } from "@/features/admin/admin.api";
import { StatCard } from "@/design-system/admin/stat-card";
import { Skeleton } from "@/design-system/components/skeleton";
import { ErrorState } from "@/design-system/components/error-state";
import { formatVnd } from "@/lib/format-currency";
import type { DashboardSummary } from "@/features/admin/admin.types";

type LoadState = "loading" | "error" | "ready";

export default function DashboardPage() {
  const t = useTranslations("admin");
  const tCommon = useTranslations("common");
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [state, setState] = useState<LoadState>("loading");

  const load = useCallback(() => {
    setState("loading");
    getDashboardSummary()
      .then((d) => {
        setData(d);
        setState("ready");
      })
      .catch(() => setState("error"));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">{t("dashboard")}</h1>
        <p className="mt-1 text-sm text-text-muted">{t("dashboardSubtitle")}</p>
      </div>

      {state === "loading" && <DashboardSkeleton />}
      {state === "error" && (
        <ErrorState
          title={t("loadErrorTitle")}
          description={t("loadErrorDesc")}
          onRetry={load}
          retryLabel={tCommon("retry")}
        />
      )}
      {state === "ready" && data && <DashboardContent data={data} />}
    </div>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xs font-semibold uppercase tracking-wide text-text-muted">{children}</h2>
  );
}

function DashboardContent({ data }: { data: DashboardSummary }) {
  const t = useTranslations("admin");

  return (
    <>
      {/* Today's snapshot — primary KPIs */}
      <section className="flex flex-col gap-4">
        <SectionHeading>{t("todayTitle")}</SectionHeading>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <StatCard emphasis tone="brand" icon={CalendarDays} label={t("newOrdersToday")} value={data.newOrdersToday} />
          <StatCard emphasis tone="success" icon={TrendingUp} label={t("revenueToday")} value={formatVnd(data.revenueTodayVnd)} />
        </div>
      </section>

      {/* All-time overview + operational alerts */}
      <section className="flex flex-col gap-4">
        <SectionHeading>{t("overviewTitle")}</SectionHeading>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <StatCard icon={ShoppingCart} label={t("totalOrders")} value={data.totalOrders} />
          <StatCard tone="brand" icon={Wallet} label={t("totalRevenue")} value={formatVnd(data.totalRevenueVnd)} />
          <StatCard tone="warning" icon={Clock} label={t("pendingOrders")} value={data.pendingOrders} />
          <StatCard tone="success" icon={CheckCircle2} label={t("paidOrders")} value={data.paidOrders} />
          <StatCard icon={XCircle} label={t("cancelledOrders")} value={data.cancelledOrders} />
          <StatCard
            tone={data.lowStockProducts > 0 ? "warning" : "default"}
            icon={PackageX}
            label={t("lowStock")}
            value={data.lowStockProducts}
          />
          <StatCard
            tone={data.failedPayments > 0 ? "danger" : "default"}
            icon={CreditCard}
            label={t("failedPayments")}
            value={data.failedPayments}
          />
        </div>
      </section>
    </>
  );
}

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-8" aria-busy>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
    </div>
  );
}
