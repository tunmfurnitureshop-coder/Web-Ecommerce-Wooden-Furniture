"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useCustomerAuth } from "./CustomerAuthContext";
import { AddressForm } from "./AddressForm";
import type { CustomerAddress } from "@/features/customer/customer.types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

interface Props {
  addresses: CustomerAddress[];
  onChange: (addresses: CustomerAddress[]) => void;
}

export function AddressList({ addresses, onChange }: Props) {
  const t = useTranslations("account.addresses");
  const { customerFetch } = useCustomerAuth();
  const [editing, setEditing] = useState<CustomerAddress | "new" | null>(null);

  async function setDefault(id: string) {
    try {
      await customerFetch<CustomerAddress>(
        `/api/v1/customer/addresses/${id}/set-default`,
        { method: "POST" }
      );
      onChange(addresses.map((a) => ({ ...a, isDefault: a.id === id })));
    } catch {}
  }

  async function remove(id: string) {
    try {
      await customerFetch(`/api/v1/customer/addresses/${id}`, { method: "DELETE" });
      onChange(addresses.filter((a) => a.id !== id));
    } catch {}
  }

  function handleSaved(saved: CustomerAddress) {
    if (editing === "new") {
      onChange([...addresses, saved]);
    } else {
      onChange(addresses.map((a) => (a.id === saved.id ? saved : a)));
    }
    setEditing(null);
  }

  if (editing) {
    return (
      <AddressForm
        address={editing === "new" ? undefined : editing}
        onSaved={handleSaved}
        onCancel={() => setEditing(null)}
      />
    );
  }

  return (
    <div className="space-y-4">
      {addresses.length === 0 && (
        <p className="text-muted-foreground text-sm">{t("empty")}</p>
      )}
      <div className="space-y-3">
        {addresses.map((addr) => (
          <Card key={addr.id}>
            <CardContent className="pt-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-0.5">
                  <p className="font-medium">{addr.recipientName}</p>
                  <p className="text-sm text-muted-foreground">{addr.phone}</p>
                  <p className="text-sm text-muted-foreground">{addr.fullAddress}</p>
                  {addr.isDefault && (
                    <Badge variant="secondary" className="mt-1">
                      {t("defaultBadge")}
                    </Badge>
                  )}
                </div>
                <div className="flex flex-col gap-1 flex-shrink-0">
                  <Button size="sm" variant="outline" onClick={() => setEditing(addr)}>
                    {t("edit")}
                  </Button>
                  {!addr.isDefault && (
                    <Button size="sm" variant="outline" onClick={() => setDefault(addr.id)}>
                      {t("setDefault")}
                    </Button>
                  )}
                  <Button size="sm" variant="destructive" onClick={() => remove(addr.id)}>
                    {t("delete")}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Button onClick={() => setEditing("new")}>{t("addNew")}</Button>
    </div>
  );
}
