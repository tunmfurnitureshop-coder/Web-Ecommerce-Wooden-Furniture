"use client";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useCustomerAuth } from "@/components/customer/CustomerAuthContext";
import { AddressList } from "@/components/customer/AddressList";
import { ErrorState } from "@/design-system/components/error-state";
import { Skeleton } from "@/design-system/components/skeleton";
import type { CustomerAddress } from "@/features/customer/customer.types";

export default function AddressesPage() {
  const t = useTranslations("account.addresses");
  const { customerFetch } = useCustomerAuth();
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    setError(false);
    customerFetch<CustomerAddress[]>("/api/v1/customer/addresses")
      .then(setAddresses)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (error) return <ErrorState onRetry={load} />;

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-6 w-40" />
        {[1, 2].map((i) => (
          <div key={i} className="rounded-lg border border-border-default p-4 flex flex-col gap-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-56" />
            <Skeleton className="h-3 w-24" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-text-primary">{t("title")}</h1>
      <AddressList addresses={addresses} onChange={setAddresses} />
    </div>
  );
}
