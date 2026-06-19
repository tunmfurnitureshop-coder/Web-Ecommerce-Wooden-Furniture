"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/lib/i18n";
import { removeAdminToken } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export function AdminHeader() {
  const t = useTranslations("admin");
  const router = useRouter();

  function logout() {
    removeAdminToken();
    router.push("/admin/login");
  }

  return (
    <header className="h-14 border-b bg-card flex items-center justify-between px-6">
      <span className="text-sm text-muted-foreground">Nội Thất Gỗ — Admin</span>
      <Button size="sm" variant="outline" onClick={logout}>{t("logout")}</Button>
    </header>
  );
}
