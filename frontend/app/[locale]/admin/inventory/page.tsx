"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { InventoryTable } from "@/components/admin/InventoryTable";
import { adminListInventory } from "@/features/admin/admin.api";
import type { InventoryItem } from "@/features/admin/admin.types";

export default function AdminInventoryPage() {
  const t = useTranslations("admin");
  const [items, setItems] = useState<InventoryItem[]>([]);

  useEffect(() => {
    adminListInventory().then((r) => setItems(r.items)).catch(console.error);
  }, []);

  return (
    <div>
      <h1 className="text-xl font-bold mb-6">{t("inventory")}</h1>
      <InventoryTable items={items} onUpdate={setItems} />
    </div>
  );
}
