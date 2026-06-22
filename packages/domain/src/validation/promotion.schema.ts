import { z } from "zod";

export const couponCodeSchema = z
  .string()
  .min(1)
  .max(50)
  .transform((v) => v.trim().toUpperCase());

export const cartQuoteSchema = z.object({
  locale: z.string().default("vi"),
  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        quantity: z.number().int().positive(),
        selectedOptions: z.object({
          woodType: z.string(),
          finish: z.string(),
          size: z.string(),
        }),
      })
    )
    .min(1),
  couponCode: couponCodeSchema.optional(),
  paymentMethod: z.string().optional(),
});

export type CartQuoteInput = z.infer<typeof cartQuoteSchema>;
