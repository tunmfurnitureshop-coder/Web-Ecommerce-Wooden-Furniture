"use client";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { api } from "@/lib/api";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Button } from "@/design-system/components/button";
import { InlineFieldError } from "@/design-system/components/inline-field-error";
import { Alert } from "@/design-system/components/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ResetPasswordPage() {
  const t = useTranslations("auth.resetPassword");
  const router = useRouter();
  const token = useSearchParams().get("token") ?? "";
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirm) { setError(t("mismatch")); return; }
    setError("");
    setLoading(true);
    try {
      await api.post("/api/v1/customer/auth/reset-password", { token, newPassword });
      setSuccess(true);
      setTimeout(() => router.push("/login"), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("submit"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout title={t("title")}>
      {success ? (
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
            <Label htmlFor="newPassword">{t("newPassword")}</Label>
            <Input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="confirm">{t("confirmPassword")}</Label>
            <Input
              id="confirm"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              autoComplete="new-password"
            />
          </div>
          <InlineFieldError message={error} />
          <Button type="submit" variant="primary" fullWidth isLoading={loading}>
            {t("submit")}
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
