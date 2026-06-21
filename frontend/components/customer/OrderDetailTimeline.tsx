"use client";

import { useTranslations } from "next-intl";
import type { OrderEvent } from "@/features/customer/customer.types";

interface Props {
  events: OrderEvent[];
}

export function OrderDetailTimeline({ events }: Props) {
  const t = useTranslations("account.orders.detail");

  return (
    <div className="space-y-3">
      <h3 className="font-semibold">{t("timeline")}</h3>
      <ol className="relative border-l border-border pl-6 space-y-5">
        {events.map((event, idx) => (
          <li key={idx} className="relative">
            <div className="absolute -left-[1.4rem] w-2.5 h-2.5 rounded-full bg-primary border-2 border-background mt-1" />
            <p className="text-sm font-medium">{event.eventType.replace(/_/g, " ")}</p>
            {event.note && <p className="text-xs text-muted-foreground">{event.note}</p>}
            <p className="text-xs text-muted-foreground">
              {new Date(event.createdAt).toLocaleString("vi-VN")}
            </p>
          </li>
        ))}
      </ol>
    </div>
  );
}
