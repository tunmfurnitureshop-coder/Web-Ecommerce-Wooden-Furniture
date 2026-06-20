export interface ProductImage {
  id: string;
  productId: string;
  imageUrl: string;
  storageKey: string;
  altText: string | null;
  sortOrder: number;
  isPrimary: boolean;
  linkedFinishCode: string | null;
}

export interface ProductImageListResponse {
  items: ProductImage[];
}

export interface UpdateImageRequest {
  altText?: string;
  sortOrder?: number;
  isPrimary?: boolean;
  linkedFinishCode?: string;
}
