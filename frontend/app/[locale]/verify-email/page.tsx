"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { api } from "@/lib/api";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Alert } from "@/design-system/components/alert";
import { Skeleton } from "@/design-system/components/skeleton";

export default function VerifyEmailPage() {
  const t = useTranslations("auth.verifyEmail");
  const token = useSearchParams().get("token") ?? "";
  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");

  useEffect(() => {
    if (!token) { setStatus("error"); return; }
    api
      .post("/api/v1/customer/auth/verify-email", { token })
      .then(() => setStatus("success"))
      .catch(() => setStatus("error"));
  }, [token]);

  return (
    <AuthLayout>
      <div className="flex flex-col gap-4 text-center py-2">
        {status === "verifying" && (
          <div className="flex flex-col items-center gap-3">
            <Skeleton className="h-10 w-full rounded-md" />
            <p className="text-sm text-text-muted">{t("verifying")}</p>
          </div>
        )}
        {status === "success" && (
          <Alert variant="success">{t("success")}</Alert>
        )}
        {status === "error" && (
          <Alert variant="danger">{t("error")}</Alert>
        )}
        {status !== "verifying" && (
          <Link
            href="/login"
            className="text-sm text-brand hover:text-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus rounded-sm"
          >
            {t("backToLogin")}
          </Link>
        )}
      </div>
    </AuthLayout>
  );
}
