"use client";

import { useState, useRef } from "react";
import type { ProductImage } from "@/features/media/media.types";
import { uploadProductImage, deleteProductImage, updateProductImage } from "@/features/media/media.api";
import { Button } from "@/components/ui/button";

interface Props {
  productId: string;
  initialImages: ProductImage[];
}

export function ProductImageManager({ productId, initialImages }: Props) {
  const [images, setImages] = useState<ProductImage[]>(initialImages);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const img = await uploadProductImage(productId, file, { isPrimary: images.length === 0 });
      setImages((prev) => [...prev, img]);
    } catch {
      alert("Upload thất bại");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function handleDelete(imageId: string) {
    if (!confirm("Xóa ảnh này?")) return;
    try {
      await deleteProductImage(productId, imageId);
      setImages((prev) => prev.filter((i) => i.id !== imageId));
    } catch {
      alert("Xóa thất bại");
    }
  }

  async function handleSetPrimary(imageId: string) {
    try {
      await updateProductImage(productId, imageId, { isPrimary: true });
      setImages((prev) => prev.map((i) => ({ ...i, isPrimary: i.id === imageId })));
    } catch {
      alert("Cập nhật thất bại");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
          {uploading ? "Đang tải lên..." : "Tải ảnh lên"}
        </Button>
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleUpload} />
      </div>

      {images.length === 0 && <p className="text-sm text-muted-foreground">Chưa có ảnh nào.</p>}

      <div className="grid grid-cols-3 gap-3">
        {images.map((img) => (
          <div key={img.id} className="relative group border rounded overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img.imageUrl} alt={img.altText ?? ""} className="w-full aspect-square object-cover" />
            {img.isPrimary && (
              <span className="absolute top-1 left-1 bg-primary text-primary-foreground text-xs px-1 rounded">Chính</span>
            )}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1 items-center justify-center p-2">
              {!img.isPrimary && (
                <Button size="sm" variant="secondary" className="w-full text-xs h-7" onClick={() => handleSetPrimary(img.id)}>
                  Đặt làm chính
                </Button>
              )}
              <Button size="sm" variant="destructive" className="w-full text-xs h-7" onClick={() => handleDelete(img.id)}>
                Xóa
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
