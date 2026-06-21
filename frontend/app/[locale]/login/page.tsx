"use client";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useRouter, Link } from "@/i18n/navigation";
import { useCustomerAuth } from "@/components/customer/CustomerAuthContext";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Button } from "@/design-system/components/button";
import { InlineFieldError } from "@/design-system/components/inline-field-error";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const t = useTranslations("auth.login");
  const { login } = useCustomerAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo") ?? "/account/profile";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      router.push(returnTo);
    } catch {
      setError(t("error"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout title={t("title")}>
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
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password">{t("password")}</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </div>
        <InlineFieldError message={error} />
        <Button type="submit" variant="primary" fullWidth isLoading={loading}>
          {t("submit")}
        </Button>
        <div className="flex justify-between text-sm">
          <Link
            href="/forgot-password"
            className="text-brand hover:text-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus rounded-sm"
          >
            {t("forgotPassword")}
          </Link>
          <span className="text-text-muted">
            {t("noAccount")}{" "}
            <Link
              href="/register"
              className="text-brand hover:text-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus rounded-sm"
            >
              {t("register")}
            </Link>
          </span>
        </div>
      </form>
    </AuthLayout>
  );
}
