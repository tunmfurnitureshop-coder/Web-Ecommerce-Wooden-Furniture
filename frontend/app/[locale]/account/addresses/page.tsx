"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useCustomerAuth } from "@/components/customer/CustomerAuthContext";
import { AddressList } from "@/components/customer/AddressList";
import type { CustomerAddress } from "@/features/customer/customer.types";

export default function AddressesPage() {
  const t = useTranslations("account.addresses");
  const tCommon = useTranslations("common");
  const { customerFetch } = useCustomerAuth();
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    customerFetch<CustomerAddress[]>("/api/v1/customer/addresses")
      .then(setAddresses)
      .catch(() => setError(tCommon("error")))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error) return <p className="text-destructive">{error}</p>;
  if (loading) return <p className="text-muted-foreground">{tCommon("loading")}</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">{t("title")}</h1>
      <AddressList addresses={addresses} onChange={setAddresses} />
    </div>
  );
}
