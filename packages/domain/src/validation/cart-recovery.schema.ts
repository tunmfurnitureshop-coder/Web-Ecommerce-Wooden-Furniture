import { z } from "zod";

export const upsertCartRecoverySchema = z.object({
  anonymousId: z.string().max(128).optional(),
  sessionId: z.string().max(128).optional(),
  email: z.string().email().optional(),
  marketingOptIn: z.boolean().default(false),
  locale: z.string().max(10).default("vi"),
  cartItems: z.array(z.unknown()).default([]),
  cartValueVnd: z.number().int().nonnegative().optional(),
});

export const restoreCartSchema = z.object({
  token: z.string().min(1).max(128),
});

export type UpsertCartRecoveryInput = z.infer<typeof upsertCartRecoverySchema>;
export type RestoreCartInput = z.infer<typeof restoreCartSchema>;
