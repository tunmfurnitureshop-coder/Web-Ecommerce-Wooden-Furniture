"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "@/lib/i18n";
import { getAdminToken } from "@/lib/auth";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminHeader } from "@/components/admin/AdminHeader";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const isLoginPage = pathname === "/admin/login";
  // null = pending check, false = no token (redirecting), true = authenticated
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    if (isLoginPage) {
      // Reset auth state so navigating away from login always re-validates
      setAuthed(null);
      return;
    }
    if (!getAdminToken()) {
      setAuthed(false);
      router.push("/admin/login");
    } else {
      setAuthed(true);
    }
  }, [router, isLoginPage]);

  // Login page renders directly — no auth gate needed
  if (isLoginPage) return <>{children}</>;

  // Block children until token is confirmed to prevent unauthenticated API calls
  if (authed !== true) return null;

  return (
    <div className="flex h-screen overflow-hidden">
      <AdminSidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <AdminHeader />
        <main className="flex-1 overflow-y-auto p-6 bg-muted/20">{children}</main>
      </div>
    </div>
  );
}
