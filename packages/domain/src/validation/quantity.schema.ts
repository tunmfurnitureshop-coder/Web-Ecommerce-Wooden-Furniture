import { z } from "zod";

export const quantitySchema = z.number().int().min(1).max(99);
export const quantityObjectSchema = z.object({ quantity: quantitySchema });

export type QuantityInput = z.infer<typeof quantityObjectSchema>;
