"use client";
import { useTranslations } from "next-intl";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";
import { CheckoutOrderSummary } from "@/components/checkout/CheckoutOrderSummary";
import { Container } from "@/design-system/primitives/container";

export default function CheckoutPage() {
  const t = useTranslations("checkout");
  return (
    <Container className="py-8 pb-8 lg:pb-16">
      <h1 className="text-2xl font-bold text-text-primary mb-8">{t("title")}</h1>
      {/* Summary is source-first so it sits on top on mobile (collapsed accordion);
          lg:order flips it to the right rail on desktop. */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px]">
        <CheckoutOrderSummary className="lg:order-2" />
        <CheckoutForm className="lg:order-1" />
      </div>
    </Container>
  );
}
