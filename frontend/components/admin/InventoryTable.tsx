"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { adminUpdateInventory, adminListInventory } from "@/features/admin/admin.api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { InventoryItem } from "@/features/admin/admin.types";

interface Props {
  items: InventoryItem[];
  onUpdate: (items: InventoryItem[]) => void;
}

export function InventoryTable({ items, onUpdate }: Props) {
  const t = useTranslations("admin");
  const [editing, setEditing] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);

  async function save(productId: string) {
    const qty = Number(editing[productId]);
    if (isNaN(qty) || qty < 0) return;
    setSaving(productId);
    try {
      await adminUpdateInventory(productId, { totalQty: qty });
      const updated = await adminListInventory();
      onUpdate(updated.items);
      setEditing((e) => { const n = { ...e }; delete n[productId]; return n; });
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
          <tr className="border-b text-left text-muted-foreground">
            <th className="pb-3 pr-4">SKU</th>
            <th className="pb-3 pr-4">Tên sản phẩm</th>
            <th className="pb-3 pr-4">Tổng</th>
            <th className="pb-3 pr-4">Đặt trước</th>
            <th className="pb-3 pr-4">Có sẵn</th>
            <th className="pb-3"></th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.productId} className="border-b">
              <td className="py-3 pr-4 font-mono text-xs">{item.sku}</td>
              <td className="py-3 pr-4">{item.nameVi}</td>
              <td className="py-3 pr-4">
                <Input
                  type="number"
                  min={0}
                  className="w-20 h-8"
                  value={editing[item.productId] ?? item.totalQty}
                  onChange={(e) => setEditing((prev) => ({ ...prev, [item.productId]: e.target.value }))}
                />
              </td>
              <td className="py-3 pr-4 text-muted-foreground">{item.reservedQty}</td>
              <td className="py-3 pr-4">{item.availableQty}</td>
              <td className="py-3">
                {editing[item.productId] !== undefined && (
                  <Button
                    size="sm"
                    disabled={saving === item.productId}
                    onClick={() => save(item.productId)}
                  >
                    {saving === item.productId ? "..." : t("updateInventory")}
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
