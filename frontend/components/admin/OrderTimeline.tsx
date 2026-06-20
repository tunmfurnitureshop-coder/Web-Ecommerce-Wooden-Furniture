"use client";

interface OrderEvent {
  id: string;
  eventType: string;
  actorType: string;
  oldValue: Record<string, unknown> | null;
  newValue: Record<string, unknown> | null;
  note: string | null;
  createdAt: string;
}

interface Props {
  events: OrderEvent[];
}

const EVENT_LABELS: Record<string, string> = {
  ORDER_CREATED: "Đơn hàng được tạo",
  PAYMENT_LINK_CREATED: "Link thanh toán được tạo",
  PAYMENT_LINK_CREATE_FAILED: "Tạo link thanh toán thất bại",
  PAYMENT_SUCCESS: "Thanh toán thành công",
  PAYMENT_FAILED: "Thanh toán thất bại",
  PAYMENT_CANCELLED: "Thanh toán bị hủy",
  MANUAL_PAYMENT_CONFIRMED: "Xác nhận thanh toán thủ công",
  ORDER_CANCELLED: "Đơn hàng bị hủy",
  ORDER_STATUS_UPDATED: "Cập nhật trạng thái",
};

export function OrderTimeline({ events }: Props) {
  if (!events.length) {
    return <p className="text-sm text-muted-foreground">Chưa có sự kiện nào.</p>;
  }

  return (
    <ol className="relative border-l border-border ml-3 space-y-4">
      {events.map((ev) => (
        <li key={ev.id} className="ml-4">
          <div className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full border border-background bg-primary" />
          <p className="text-sm font-medium">{EVENT_LABELS[ev.eventType] ?? ev.eventType}</p>
          <p className="text-xs text-muted-foreground">{new Date(ev.createdAt).toLocaleString("vi-VN")} · {ev.actorType}</p>
          {ev.note && <p className="text-xs mt-0.5 text-muted-foreground italic">{ev.note}</p>}
        </li>
      ))}
    </ol>
  );
}
