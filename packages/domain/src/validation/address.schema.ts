import { z } from "zod";

export const addressSchema = z.object({
  recipientName: z.string().min(1).max(100),
  phone: z.string().regex(/^(03|05|07|08|09)[0-9]{8}$/),
  fullAddress: z.string().min(5).max(500),
  provinceCode: z.string().optional(),
  districtCode: z.string().optional(),
  wardCode: z.string().optional(),
  isDefault: z.boolean().default(false),
});

export type AddressInput = z.infer<typeof addressSchema>;
