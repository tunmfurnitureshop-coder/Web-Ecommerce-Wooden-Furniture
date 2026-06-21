import { z } from "zod";

export const productOptionSchema = z.object({
  woodType: z.string().min(1),
  finish: z.string().min(1),
  size: z.string().min(1),
  quantity: z.number().int().min(1).max(99),
});

export type ProductOptionInput = z.infer<typeof productOptionSchema>;
