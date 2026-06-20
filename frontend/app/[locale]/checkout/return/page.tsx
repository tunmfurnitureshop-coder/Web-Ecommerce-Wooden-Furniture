"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/lib/i18n";
import { getOrderPaymentStatus, retryPayment } from "@/features/checkout/checkout.api";
import type { OrderPaymentStatus } from "@/features/checkout/checkout.types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "@/lib/i18n";

type State = "loading" | "paid" | "pending" | "failed" | "error";

export default function CheckoutReturnPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [state, setState] = useState<State>("loading");
  const [order, setOrder] = useState<OrderPaymentStatus | null>(null);
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    const code = searchParams.get("orderCode") ?? (typeof window !== "undefined" ? sessionStorage.getItem("pendingOrderCode") : null);
    if (!code) { setState("error"); return; }
    getOrderPaymentStatus(code)
      .then((data) => {
        setOrder(data);
        if (data.paymentStatus === "PAID") setState("paid");
        else if (data.paymentStatus === "FAILED" || data.paymentStatus === "CANCELLED") setState("failed");
        else setState("pending");
      })
      .catch(() => setState("error"));
  }, [searchParams]);

  async function handleRetry() {
    if (!order) return;
    setRetrying(true);
    try {
      const res = await retryPayment(order.orderCode);
      window.location.href = res.checkoutUrl;
    } catch {
      setRetrying(false);
    }
  }

  if (state === "loading") {
    return (
      <div className="max-w-lg mx-auto px-6 py-20 text-center">
        <p className="text-muted-foreground">Đang kiểm tra trạng thái thanh toán...</p>
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="max-w-lg mx-auto px-6 py-20 text-center">
        <p className="text-muted-foreground">Không tìm thấy thông tin đơn hàng.</p>
        <Link href="/products" className="mt-4 inline-block">
          <Button>Tiếp tục mua sắm</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-6 py-12">
      {state === "paid" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-green-600">Thanh toán thành công!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">Mã đơn hàng: <span className="font-medium text-foreground">{order?.orderCode}</span></p>
            <p className="text-sm">Chúng tôi sẽ xử lý đơn hàng của bạn trong thời gian sớm nhất.</p>
            <Button className="w-full mt-4" onClick={() => router.push(`/success?orderCode=${order?.orderCode}`)}>
              Xem chi tiết đơn hàng
            </Button>
          </CardContent>
        </Card>
      )}

      {state === "pending" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-yellow-600">Đang chờ xác nhận</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">Mã đơn hàng: <span className="font-medium text-foreground">{order?.orderCode}</span></p>
            <p className="text-sm">Thanh toán đang được xử lý. Vui lòng chờ trong giây lát.</p>
            <div className="flex gap-2 mt-4">
              <Button variant="outline" className="flex-1" onClick={() => router.refresh()}>Kiểm tra lại</Button>
              <Button className="flex-1" onClick={handleRetry} disabled={retrying}>
                {retrying ? "Đang xử lý..." : "Thanh toán lại"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {state === "failed" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-destructive">Thanh toán thất bại</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">Mã đơn hàng: <span className="font-medium text-foreground">{order?.orderCode}</span></p>
            <p className="text-sm">Thanh toán không thành công. Bạn có thể thử lại hoặc chọn phương thức khác.</p>
            <Button className="w-full mt-4" onClick={handleRetry} disabled={retrying}>
              {retrying ? "Đang xử lý..." : "Thử lại thanh toán"}
            </Button>
            <Link href="/products" className="block mt-2 text-center text-sm text-muted-foreground underline">
              Tiếp tục mua sắm
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
