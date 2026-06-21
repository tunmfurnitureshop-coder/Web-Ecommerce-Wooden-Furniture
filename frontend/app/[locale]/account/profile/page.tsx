"use client";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useCustomerAuth } from "@/components/customer/CustomerAuthContext";
import { ProfileForm } from "@/components/customer/ProfileForm";
import { ErrorState } from "@/design-system/components/error-state";
import { Skeleton } from "@/design-system/components/skeleton";
import type { CustomerPublic } from "@/features/customer/customer.types";

export default function ProfilePage() {
  const t = useTranslations("account.profile");
  const tCommon = useTranslations("common");
  const { customerFetch } = useCustomerAuth();
  const [profile, setProfile] = useState<CustomerPublic | null>(null);
  const [error, setError] = useState(false);

  function load() {
    setError(false);
    customerFetch<CustomerPublic>("/api/v1/customer/me")
      .then(setProfile)
      .catch(() => setError(true));
  }

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (error) return <ErrorState onRetry={load} />;
  if (!profile) return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-6 w-40" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
    </div>
  );

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-text-primary">{t("title")}</h1>
      <ProfileForm profile={profile} onUpdated={setProfile} />
    </div>
  );
}
