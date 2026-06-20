"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { retryPayment } from "@/features/checkout/checkout.api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "@/lib/i18n";

export default function CheckoutCancelPage() {
  const searchParams = useSearchParams();
  const orderCode = searchParams.get("orderCode") ?? (typeof window !== "undefined" ? sessionStorage.getItem("pendingOrderCode") : null);
  const [retrying, setRetrying] = useState(false);

  async function handleRetry() {
    if (!orderCode) return;
    setRetrying(true);
    try {
      const res = await retryPayment(orderCode);
      window.location.href = res.checkoutUrl;
    } catch {
      setRetrying(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto px-6 py-12">
      <Card>
        <CardHeader>
          <CardTitle>Thanh toán đã bị hủy</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {orderCode && (
            <p className="text-sm text-muted-foreground">
              Mã đơn hàng: <span className="font-medium text-foreground">{orderCode}</span>
            </p>
          )}
          <p className="text-sm">
            Bạn đã hủy quá trình thanh toán. Đơn hàng vẫn được giữ lại — bạn có thể thử thanh toán lại bất cứ lúc nào.
          </p>
          <div className="flex gap-2 mt-4">
            <Link href="/cart" className="flex-1">
              <Button variant="outline" className="w-full">Xem giỏ hàng</Button>
            </Link>
            {orderCode && (
              <Button className="flex-1" onClick={handleRetry} disabled={retrying}>
                {retrying ? "Đang xử lý..." : "Thanh toán lại"}
              </Button>
            )}
          </div>
          <Link href="/products" className="block mt-2 text-center text-sm text-muted-foreground underline">
            Tiếp tục mua sắm
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
