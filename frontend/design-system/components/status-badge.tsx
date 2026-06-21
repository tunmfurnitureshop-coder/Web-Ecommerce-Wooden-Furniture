"use client";
import { useTranslations } from "next-intl";
import { Badge } from "./badge";
import type { HTMLAttributes } from "react";

type OrderStatus = "PENDING_PAYMENT" | "PAID" | "PROCESSING" | "SHIPPING" | "DELIVERED" | "CANCELLED";
type PaymentStatus = "UNPAID" | "PENDING" | "PAID" | "FAILED" | "CANCELLED" | "EXPIRED";

type StatusBadgeProps = HTMLAttributes<HTMLSpanElement> & {
  type: "order" | "payment";
  status: OrderStatus | PaymentStatus;
};

const orderVariantMap: Record<OrderStatus, "default" | "success" | "warning" | "danger" | "info"> = {
  PENDING_PAYMENT: "warning",
  PAID: "info",
  PROCESSING: "info",
  SHIPPING: "info",
  DELIVERED: "success",
  CANCELLED: "danger",
};

const paymentVariantMap: Record<PaymentStatus, "default" | "success" | "warning" | "danger" | "info"> = {
  UNPAID: "default",
  PENDING: "warning",
  PAID: "success",
  FAILED: "danger",
  CANCELLED: "danger",
  EXPIRED: "danger",
};

export function StatusBadge({ type, status, className, ...props }: StatusBadgeProps) {
  const tOrder = useTranslations("orderStatus");
  const tPayment = useTranslations("paymentStatus");

  const variant = type === "order"
    ? orderVariantMap[status as OrderStatus] ?? "default"
    : paymentVariantMap[status as PaymentStatus] ?? "default";

  const label = type === "order"
    ? tOrder(status as Parameters<typeof tOrder>[0])
    : tPayment(status as Parameters<typeof tPayment>[0]);

  return (
    <Badge variant={variant} className={className} {...props}>
      {label}
    </Badge>
  );
}
