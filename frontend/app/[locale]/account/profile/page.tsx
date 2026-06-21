"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useCustomerAuth } from "@/components/customer/CustomerAuthContext";
import { ProfileForm } from "@/components/customer/ProfileForm";
import type { CustomerPublic } from "@/features/customer/customer.types";

export default function ProfilePage() {
  const t = useTranslations("account.profile");
  const tCommon = useTranslations("common");
  const { customerFetch } = useCustomerAuth();
  const [profile, setProfile] = useState<CustomerPublic | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    customerFetch<CustomerPublic>("/api/v1/customer/me")
      .then(setProfile)
      .catch(() => setError(tCommon("error")));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error) return <p className="text-destructive">{error}</p>;
  if (!profile) return <p className="text-muted-foreground">{tCommon("loading")}</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">{t("title")}</h1>
      <ProfileForm profile={profile} onUpdated={setProfile} />
    </div>
  );
}
