"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { adminUpdateInventory } from "@/features/admin/admin.api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { InventoryItem } from "@/features/admin/admin.types";

interface Props {
  items: InventoryItem[];
  /** Called after a successful save so the parent can refetch the list. */
  onSaved: () => void;
}

export function InventoryTable({ items, onSaved }: Props) {
  const t = useTranslations("admin");
  const [editing, setEditing] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);

  async function save(productId: string) {
    const qty = Number(editing[productId]);
    if (isNaN(qty) || qty < 0) return;
    setSaving(productId);
    try {
      await adminUpdateInventory(productId, { totalQty: qty });
      setEditing((e) => {
        const n = { ...e };
        delete n[productId];
        return n;
      });
      onSaved();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border-default text-left text-text-muted">
            <th className="pb-3 pr-4">{t("sku")}</th>
            <th className="pb-3 pr-4">{t("productName")}</th>
            <th className="pb-3 pr-4">{t("totalQty")}</th>
            <th className="pb-3 pr-4">{t("reservedQty")}</th>
            <th className="pb-3 pr-4">{t("availableQty")}</th>
            <th className="pb-3"></th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.productId} className="border-b border-border-default">
              <td className="py-3 pr-4 font-mono text-xs">{item.sku}</td>
              <td className="py-3 pr-4">{item.nameVi}</td>
              <td className="py-3 pr-4">
                <Input
                  type="number"
                  min={0}
                  aria-label={`${t("totalQty")} — ${item.sku}`}
                  className="h-8 w-20"
                  value={editing[item.productId] ?? item.totalQty}
                  onChange={(e) => setEditing((prev) => ({ ...prev, [item.productId]: e.target.value }))}
                />
              </td>
              <td className="py-3 pr-4 text-text-muted">{item.reservedQty}</td>
              <td className="py-3 pr-4">{item.availableQty}</td>
              <td className="py-3">
                {editing[item.productId] !== undefined && (
                  <Button
                    size="sm"
                    disabled={saving === item.productId}
                    onClick={() => save(item.productId)}
                  >
                    {saving === item.productId ? t("saving") : t("updateInventory")}
                  </Button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
