import { Badge } from "./badge";
import type { HTMLAttributes } from "react";

type OrderStatus = "PENDING_PAYMENT" | "PAID" | "PROCESSING" | "SHIPPING" | "DELIVERED" | "CANCELLED";
type PaymentStatus = "UNPAID" | "PENDING" | "PAID" | "FAILED" | "CANCELLED";

type StatusBadgeProps = HTMLAttributes<HTMLSpanElement> & {
  type: "order" | "payment";
  status: OrderStatus | PaymentStatus;
  labelMap: Record<string, string>;
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
};

export function StatusBadge({ type, status, labelMap, className, ...props }: StatusBadgeProps) {
  const variant = type === "order"
    ? orderVariantMap[status as OrderStatus] ?? "default"
    : paymentVariantMap[status as PaymentStatus] ?? "default";

  return (
    <Badge variant={variant} className={className} {...props}>
      {labelMap[status] ?? status}
    </Badge>
  );
}
