"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/lib/i18n";
import type { CustomerOrderListItem } from "@/features/customer/customer.types";
import { formatVnd } from "@/lib/format-currency";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

interface Props {
  order: CustomerOrderListItem;
}

export function OrderCard({ order }: Props) {
  const t = useTranslations("account.orders");
  const tStatus = useTranslations("orderStatus");

  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-0.5">
            <p className="font-mono font-semibold">{order.orderCode}</p>
            <p className="text-sm text-muted-foreground">
              {new Date(order.createdAt).toLocaleDateString("vi-VN")}
            </p>
            <p className="text-sm text-muted-foreground">
              {order.itemCount} {t("items")}
            </p>
          </div>
          <div className="text-right space-y-1">
            <p className="font-semibold">{formatVnd(order.totalVnd)}</p>
            <Badge variant="secondary">
              {tStatus(order.orderStatus as Parameters<typeof tStatus>[0])}
            </Badge>
          </div>
        </div>
        <div className="mt-3 border-t pt-3">
          <Link
            href={`/account/orders/${order.orderCode}`}
            className="text-sm text-primary hover:underline"
          >
            {t("viewDetail")}
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
