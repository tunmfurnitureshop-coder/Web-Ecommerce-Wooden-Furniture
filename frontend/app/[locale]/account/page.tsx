"use client";
import { useEffect } from "react";
import { useRouter } from "@/i18n/navigation";

export default function AccountPage() {
  const router = useRouter();
  useEffect(() => { router.replace("/account/profile"); }, [router]);
  return null;
}
