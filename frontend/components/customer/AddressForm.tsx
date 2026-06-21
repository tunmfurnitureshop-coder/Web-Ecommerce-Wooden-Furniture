"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useCustomerAuth } from "./CustomerAuthContext";
import type { CustomerAddress, CreateAddressBody } from "@/features/customer/customer.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  address?: CustomerAddress;
  onSaved: (address: CustomerAddress) => void;
  onCancel: () => void;
}

export function AddressForm({ address, onSaved, onCancel }: Props) {
  const t = useTranslations("account.addresses");
  const { customerFetch } = useCustomerAuth();
  const [form, setForm] = useState<CreateAddressBody>({
    recipientName: address?.recipientName ?? "",
    phone: address?.phone ?? "",
    fullAddress: address?.fullAddress ?? "",
    isDefault: address?.isDefault ?? false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function set<K extends keyof CreateAddressBody>(field: K, value: CreateAddressBody[K]) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const saved = address
        ? await customerFetch<CustomerAddress>(`/api/v1/customer/addresses/${address.id}`, {
            method: "PATCH",
            body: JSON.stringify(form),
          })
        : await customerFetch<CustomerAddress>("/api/v1/customer/addresses", {
            method: "POST",
            body: JSON.stringify(form),
          });
      onSaved(saved);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("saveError"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
      <div className="space-y-2">
        <Label htmlFor="recipientName">{t("recipientName")}</Label>
        <Input
          id="recipientName"
          value={form.recipientName}
          onChange={(e) => set("recipientName", e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="addrPhone">{t("phone")}</Label>
        <Input
          id="addrPhone"
          value={form.phone}
          onChange={(e) => set("phone", e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="fullAddress">{t("fullAddress")}</Label>
        <Input
          id="fullAddress"
          value={form.fullAddress}
          onChange={(e) => set("fullAddress", e.target.value)}
          required
        />
      </div>
      <label className="flex items-center gap-2 text-sm cursor-pointer">
        <input
          type="checkbox"
          checked={form.isDefault ?? false}
          onChange={(e) => set("isDefault", e.target.checked)}
        />
        {t("setAsDefault")}
      </label>
      {error && <p className="text-destructive text-sm">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit" disabled={loading}>
          {loading ? t("saving") : t("save")}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          {t("cancel")}
        </Button>
      </div>
    </form>
  );
}
