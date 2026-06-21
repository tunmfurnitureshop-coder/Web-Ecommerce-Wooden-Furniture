"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { api } from "@/lib/api";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Button } from "@/design-system/components/button";
import { Alert } from "@/design-system/components/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ForgotPasswordPage() {
  const t = useTranslations("auth.forgotPassword");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/api/v1/customer/auth/forgot-password", { email });
    } catch {}
    setDone(true);
    setLoading(false);
  }

  return (
    <AuthLayout title={t("title")}>
      {done ? (
        <div className="flex flex-col gap-4">
          <Alert variant="success">{t("success")}</Alert>
          <Link
            href="/login"
            className="text-sm text-brand hover:text-brand-hover text-center block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus rounded-sm"
          >
            {t("backToLogin")}
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">{t("email")}</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <Button type="submit" variant="primary" fullWidth isLoading={loading}>
            {t("submit")}
          </Button>
          <div className="text-center">
            <Link
              href="/login"
              className="text-sm text-brand hover:text-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus rounded-sm"
            >
              {t("backToLogin")}
            </Link>
          </div>
        </form>
      )}
    </AuthLayout>
  );
}
