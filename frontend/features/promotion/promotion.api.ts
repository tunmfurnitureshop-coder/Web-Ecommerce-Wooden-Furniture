import { api } from "@/lib/api";
import type { CartQuoteRequest, CartQuoteResponse } from "./promotion.types";

export async function cartQuote(req: CartQuoteRequest): Promise<CartQuoteResponse> {
  return api.post<CartQuoteResponse>("/api/v1/cart/quote", req);
}
