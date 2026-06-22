import type { CartItem } from "@/features/cart/cart.types";

export interface UpsertCartRecoverySessionRequest {
  anonymousId?: string;
  sessionId?: string;
  email?: string;
  marketingOptIn?: boolean;
  locale?: string;
  cartItems: CartItem[];
  cartValueVnd?: number;
}

export interface UpsertCartRecoverySessionResponse {
  cartRecoverySessionId: string;
}

export interface RestoreCartRequest {
  token: string;
}

export interface RestoreCartResponse {
  items: CartItem[];
}
