"use client";

import { useTranslations } from "next-intl";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";

export default function CheckoutPage() {
  const t = useTranslations("checkout");
  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold mb-8">{t("title")}</h1>
      <CheckoutForm />
    </div>
  );
}
