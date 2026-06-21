"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useCustomerAuth } from "./CustomerAuthContext";
import type { CustomerPublic } from "@/features/customer/customer.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  profile: CustomerPublic;
  onUpdated: (profile: CustomerPublic) => void;
}

export function ProfileForm({ profile, onUpdated }: Props) {
  const t = useTranslations("account.profile");
  const { customerFetch } = useCustomerAuth();
  const [fullName, setFullName] = useState(profile.fullName ?? "");
  const [phone, setPhone] = useState(profile.phone ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);
    try {
      const updated = await customerFetch<CustomerPublic>("/api/v1/customer/me", {
        method: "PATCH",
        body: JSON.stringify({ fullName: fullName || null, phone: phone || null }),
      });
      onUpdated(updated);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("saveError"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
      <div className="space-y-2">
        <Label htmlFor="fullName">{t("fullName")}</Label>
        <Input
          id="fullName"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder={t("fullNamePlaceholder")}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone">{t("phone")}</Label>
        <Input
          id="phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder={t("phonePlaceholder")}
        />
      </div>
      <div className="space-y-2">
        <Label>{t("email")}</Label>
        <Input value={profile.email} disabled className="opacity-60" />
      </div>
      {error && <p className="text-destructive text-sm">{error}</p>}
      {success && <p className="text-sm text-green-600">{t("saveSuccess")}</p>}
      <Button type="submit" disabled={loading}>
        {loading ? t("saving") : t("save")}
      </Button>
    </form>
  );
}
