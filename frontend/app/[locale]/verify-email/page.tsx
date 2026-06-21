"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link } from "@/lib/i18n";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";

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
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardContent className="pt-6 text-center space-y-4">
          {status === "verifying" && <p className="text-muted-foreground">{t("verifying")}</p>}
          {status === "success" && <p className="text-sm">{t("success")}</p>}
          {status === "error" && <p className="text-destructive text-sm">{t("error")}</p>}
          {status !== "verifying" && (
            <Link href="/login" className="text-primary hover:underline text-sm block">
              {t("backToLogin")}
            </Link>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
