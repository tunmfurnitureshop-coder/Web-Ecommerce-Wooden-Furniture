"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/lib/i18n";
import { adminListProducts } from "@/features/admin/admin.api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatVnd } from "@/lib/format-currency";
import type { AdminProduct } from "@/features/admin/admin.types";

export default function AdminProductsPage() {
  const t = useTranslations("admin");
  const [products, setProducts] = useState<AdminProduct[]>([]);

  useEffect(() => {
    adminListProducts().then((r) => setProducts(r.items)).catch(console.error);
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">{t("products")}</h1>
        <Link href="/admin/products/new">
          <Button>{t("createProduct")}</Button>
        </Link>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th className="pb-3 pr-4">SKU</th>
              <th className="pb-3 pr-4">Tên</th>
              <th className="pb-3 pr-4">Giá</th>
              <th className="pb-3 pr-4">Trạng thái</th>
              <th className="pb-3 pr-4">Tổng</th>
              <th className="pb-3 pr-4">Đặt trước</th>
              <th className="pb-3 pr-4">Có sẵn</th>
              <th className="pb-3"></th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-b">
                <td className="py-3 pr-4 font-mono text-xs">{p.sku}</td>
                <td className="py-3 pr-4">{p.nameVi}</td>
                <td className="py-3 pr-4">{formatVnd(p.basePriceVnd)}</td>
                <td className="py-3 pr-4">
                  <Badge variant={p.status === "ACTIVE" ? "default" : "secondary"}>{p.status}</Badge>
                </td>
                <td className="py-3 pr-4">{p.inventory.totalQty}</td>
                <td className="py-3 pr-4">{p.inventory.reservedQty}</td>
                <td className="py-3 pr-4">{p.inventory.availableQty}</td>
                <td className="py-3">
                  <Link href={`/admin/products/${p.id}/edit`}>
                    <Button size="sm" variant="outline">{t("edit")}</Button>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
