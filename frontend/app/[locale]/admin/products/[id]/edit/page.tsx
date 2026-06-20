"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { adminGetProduct } from "@/features/admin/admin.api";
import { listProductImages } from "@/features/media/media.api";
import { ProductForm } from "@/components/admin/ProductForm";
import { ProductImageManager } from "@/components/admin/ProductImageManager";
import type { AdminProduct } from "@/features/admin/admin.types";
import type { ProductImage } from "@/features/media/media.types";

export default function EditProductPage({ params }: { params: { id: string } }) {
  const t = useTranslations("admin");
  const [product, setProduct] = useState<AdminProduct | null>(null);
  const [images, setImages] = useState<ProductImage[]>([]);
  const { id } = params;

  useEffect(() => {
    adminGetProduct(id).then(setProduct).catch(console.error);
    listProductImages(id).then(setImages).catch(console.error);
  }, [id]);

  if (!product) return <p className="text-muted-foreground p-6">Đang tải...</p>;

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-xl font-bold mb-6">{t("editProduct")}: {product.sku}</h1>
        <ProductForm productId={id} initialData={product} />
      </div>
      <div>
        <h2 className="text-lg font-semibold mb-4">Ảnh sản phẩm</h2>
        <ProductImageManager productId={id} initialImages={images} />
      </div>
    </div>
  );
}
