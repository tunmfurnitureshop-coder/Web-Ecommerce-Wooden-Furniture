export interface ReviewOut {
  id: string;
  customerName: string;
  rating: number;
  title: string | null;
  content: string | null;
  isVerifiedPurchase: boolean;
  createdAt: string;
}

export interface ReviewSummaryOut {
  averageRating: number;
  reviewCount: number;
  distribution: Record<string, number>;
}

export interface ProductReviewsResponse {
  summary: ReviewSummaryOut;
  items: ReviewOut[];
  page: number;
  pageSize: number;
  total: number;
}

export interface ReviewSubmitRequest {
  rating: number;
  title?: string;
  content?: string;
}

export interface AdminReviewOut {
  id: string;
  productId: string;
  productName: string;
  customerId: string;
  customerName: string;
  rating: number;
  title: string | null;
  content: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED" | "HIDDEN";
  isVerifiedPurchase: boolean;
  createdAt: string;
}

export interface AdminReviewListResponse {
  items: AdminReviewOut[];
  page: number;
  pageSize: number;
  total: number;
}
