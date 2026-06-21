"use client";

import { useEffect } from "react";
import { useRouter } from "@/lib/i18n";

export default function AccountPage() {
  const router = useRouter();
  useEffect(() => { router.replace("/account/profile"); }, [router]);
  return null;
}
