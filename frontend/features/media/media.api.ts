import { api } from "@/lib/api";
import { getAuthHeaders, getAdminToken } from "@/lib/auth";
import type { ProductImage, ProductImageListResponse, UpdateImageRequest } from "./media.types";

export async function listProductImages(productId: string): Promise<ProductImage[]> {
  const res = await api.get<ProductImageListResponse>(
    `/api/v1/admin/products/${productId}/images`,
    getAuthHeaders(),
  );
  return res.items;
}

export async function uploadProductImage(
  productId: string,
  file: File,
  opts: { altText?: string; linkedFinishCode?: string; isPrimary?: boolean },
): Promise<ProductImage> {
  const form = new FormData();
  form.append("file", file);
  if (opts.altText) form.append("altText", opts.altText);
  if (opts.linkedFinishCode) form.append("linkedFinishCode", opts.linkedFinishCode);
  if (opts.isPrimary !== undefined) form.append("isPrimary", String(opts.isPrimary));
  const BASE_URL = typeof window === "undefined"
    ? (process.env.BACKEND_API_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000")
    : (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000");
  const token = getAdminToken();
  const res = await fetch(`${BASE_URL}/api/v1/admin/products/${productId}/images`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });
  if (!res.ok) throw new Error("Upload failed");
  return res.json();
}

export async function updateProductImage(
  productId: string,
  imageId: string,
  data: UpdateImageRequest,
): Promise<ProductImage> {
  return api.patch(
    `/api/v1/admin/products/${productId}/images/${imageId}`,
    data,
    getAuthHeaders(),
  );
}

export async function deleteProductImage(productId: string, imageId: string): Promise<void> {
  await api.delete(
    `/api/v1/admin/products/${productId}/images/${imageId}`,
    getAuthHeaders(),
  );
}
