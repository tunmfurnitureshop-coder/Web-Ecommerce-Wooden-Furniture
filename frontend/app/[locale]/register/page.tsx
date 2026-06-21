"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { api } from "@/lib/api";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Button } from "@/design-system/components/button";
import { InlineFieldError } from "@/design-system/components/inline-field-error";
import { Alert } from "@/design-system/components/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function RegisterPage() {
  const t = useTranslations("auth.register");
  const [form, setForm] = useState({ email: "", password: "", fullName: "", phone: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("/api/v1/customer/auth/register", {
        email: form.email,
        password: form.password,
        fullName: form.fullName || null,
        phone: form.phone || null,
      });
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("submit"));
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <AuthLayout title={t("title")}>
        <Alert variant="success">{t("success")}</Alert>
        <div className="mt-4 text-center">
          <Link href="/login" className="text-sm text-brand hover:text-brand-hover">
            {t("login")}
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title={t("title")}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="fullName">{t("fullName")}</Label>
          <Input
            id="fullName"
            value={form.fullName}
            onChange={(e) => set("fullName", e.target.value)}
            placeholder={t("fullNamePlaceholder")}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">{t("email")}</Label>
          <Input
            id="email"
            type="email"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
            required
            autoComplete="email"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password">{t("password")}</Label>
          <Input
            id="password"
            type="password"
            value={form.password}
            onChange={(e) => set("password", e.target.value)}
            required
            autoComplete="new-password"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="phone">{t("phone")}</Label>
          <Input
            id="phone"
            value={form.phone}
            onChange={(e) => set("phone", e.target.value)}
          />
        </div>
        <InlineFieldError message={error} />
        <Button type="submit" variant="primary" fullWidth isLoading={loading}>
          {t("submit")}
        </Button>
        <p className="text-center text-sm text-text-muted">
          {t("hasAccount")}{" "}
          <Link href="/login" className="text-brand hover:text-brand-hover">
            {t("login")}
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
