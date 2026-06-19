"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { adminGetProduct } from "@/features/admin/admin.api";
import { ProductForm } from "@/components/admin/ProductForm";
import type { AdminProduct } from "@/features/admin/admin.types";

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const t = useTranslations("admin");
  const [product, setProduct] = useState<AdminProduct | null>(null);
  const [id, setId] = useState("");

  useEffect(() => {
    params.then(({ id: pid }) => {
      setId(pid);
      adminGetProduct(pid).then(setProduct).catch(console.error);
    });
  }, [params]);

  if (!product) return <p className="text-muted-foreground p-6">Đang tải...</p>;

  return (
    <div>
      <h1 className="text-xl font-bold mb-6">{t("editProduct")}: {product.sku}</h1>
      <ProductForm productId={id} initialData={product} />
    </div>
  );
}
