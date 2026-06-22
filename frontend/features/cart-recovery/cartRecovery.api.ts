import { api } from "@/lib/api";
import type {
  UpsertCartRecoverySessionRequest,
  UpsertCartRecoverySessionResponse,
  RestoreCartRequest,
  RestoreCartResponse,
} from "./cartRecovery.types";

export async function upsertCartRecoverySession(
  req: UpsertCartRecoverySessionRequest
): Promise<UpsertCartRecoverySessionResponse> {
  return api.post<UpsertCartRecoverySessionResponse>("/api/v1/cart/recovery/session", req);
}

export async function restoreCart(
  req: RestoreCartRequest
): Promise<RestoreCartResponse> {
  return api.post<RestoreCartResponse>("/api/v1/cart/recovery/restore", req);
}
