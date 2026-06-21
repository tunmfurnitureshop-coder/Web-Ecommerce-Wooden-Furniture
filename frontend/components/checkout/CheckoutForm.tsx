"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useCartStore } from "@/features/cart/cart.store";
import { createOrder } from "@/features/checkout/checkout.api";
import type { PaymentMethod } from "@/features/checkout/checkout.types";
import { useCustomerAuth } from "@/components/customer/CustomerAuthContext";
import type { CustomerPublic, CustomerAddress } from "@/features/customer/customer.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";

const PAYMENT_METHODS = ["COD", "BANK_TRANSFER", "PAYOS"] as const;

export function CheckoutForm() {
  const t = useTranslations("checkout");
  const tPayment = useTranslations("payment");
  const router = useRouter();
  const { items, clearCart } = useCartStore();
  const { isAuthenticated, customerFetch } = useCustomerAuth();

  const [form, setForm] = useState({
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    shippingAddress: "",
    note: "",
    paymentMethod: "COD" as PaymentMethod,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;
    Promise.all([
      customerFetch<CustomerPublic>("/api/v1/customer/me"),
      customerFetch<CustomerAddress[]>("/api/v1/customer/addresses"),
    ]).then(([profile, addresses]) => {
      const defaultAddr = addresses.find((a) => a.isDefault) ?? addresses[0];
      setForm((f) => ({
        ...f,
        customerName: profile.fullName ?? f.customerName,
        customerPhone: profile.phone ?? f.customerPhone,
        customerEmail: profile.email,
        shippingAddress: defaultAddr?.fullAddress ?? f.shippingAddress,
      }));
    }).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  function validate() {
    const errs: Record<string, string> = {};
    if (!form.customerName.trim()) errs.customerName = "Bắt buộc";
    if (!form.customerPhone.trim()) errs.customerPhone = "Bắt buộc";
    if (!form.shippingAddress.trim()) errs.shippingAddress = "Bắt buộc";
    if (form.customerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.customerEmail)) {
      errs.customerEmail = "Email không hợp lệ";
    }
    if (items.length === 0) errs.cart = "Giỏ hàng trống";
    return errs;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      const res = await createOrder({
        customerName: form.customerName,
        customerPhone: form.customerPhone,
        customerEmail: form.customerEmail || undefined,
        shippingAddress: form.shippingAddress,
        note: form.note || undefined,
        paymentMethod: form.paymentMethod,
        items: items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          selectedOptions: i.selectedOptions,
        })),
      });
      clearCart();
      if (res.checkoutUrl) {
        if (typeof window !== "undefined") {
          sessionStorage.setItem("pendingOrderCode", res.orderCode);
        }
        window.location.href = res.checkoutUrl;
      } else {
        router.push(`/success?orderCode=${res.orderCode}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Đặt hàng thất bại";
      setErrors({ submit: msg });
    } finally {
      setLoading(false);
    }
  }

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => { const n = { ...e }; delete n[field]; return n; });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="name">{t("name")}</Label>
        <Input id="name" placeholder={t("namePlaceholder")} value={form.customerName} onChange={(e) => set("customerName", e.target.value)} />
        {errors.customerName && <p className="text-destructive text-xs">{errors.customerName}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">{t("phone")}</Label>
        <Input id="phone" placeholder={t("phonePlaceholder")} value={form.customerPhone} onChange={(e) => set("customerPhone", e.target.value)} />
        {errors.customerPhone && <p className="text-destructive text-xs">{errors.customerPhone}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">{t("email")}</Label>
        <Input id="email" type="email" placeholder={t("emailPlaceholder")} value={form.customerEmail} onChange={(e) => set("customerEmail", e.target.value)} />
        {errors.customerEmail && <p className="text-destructive text-xs">{errors.customerEmail}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">{t("address")}</Label>
        <Textarea id="address" placeholder={t("addressPlaceholder")} value={form.shippingAddress} onChange={(e) => set("shippingAddress", e.target.value)} />
        {errors.shippingAddress && <p className="text-destructive text-xs">{errors.shippingAddress}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="note">{t("note")}</Label>
        <Textarea id="note" placeholder={t("notePlaceholder")} value={form.note} onChange={(e) => set("note", e.target.value)} />
      </div>

      <div className="space-y-3">
        <Label>{t("paymentMethod")}</Label>
        <RadioGroup value={form.paymentMethod} onValueChange={(v) => set("paymentMethod", v)}>
          {PAYMENT_METHODS.map((m) => (
            <div key={m} className="flex items-center gap-2">
              <RadioGroupItem value={m} id={m} />
              <Label htmlFor={m}>{tPayment(m as never)}</Label>
            </div>
          ))}
        </RadioGroup>
        {form.paymentMethod === "PAYOS" && (
          <p className="text-xs text-muted-foreground">
            Bạn sẽ được chuyển đến trang thanh toán PayOS an toàn.
          </p>
        )}
      </div>

      {errors.cart && <p className="text-destructive text-sm">{errors.cart}</p>}
      {errors.submit && <p className="text-destructive text-sm">{errors.submit}</p>}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? t("submitting") : t("submit")}
      </Button>
    </form>
  );
}
