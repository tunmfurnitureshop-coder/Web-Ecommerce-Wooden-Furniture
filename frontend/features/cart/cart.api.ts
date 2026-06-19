import { api } from "@/lib/api";
import type { CartItem, HydratedCartResponse } from "./cart.types";

export async function hydrateCart({
  locale,
  items,
}: {
  locale: string;
  items: CartItem[];
}): Promise<HydratedCartResponse> {
  return api.post<HydratedCartResponse>("/api/v1/cart/hydrate", {
    locale,
    items,
  });
}
