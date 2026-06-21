import { z } from "zod";

export const checkoutSchema = z.object({
  customerName: z.string().min(1).max(100),
  customerPhone: z.string().regex(/^(03|05|07|08|09)[0-9]{8}$/),
  customerEmail: z.string().email().optional().or(z.literal("")),
  shippingAddress: z.string().min(5).max(500),
  paymentMethod: z.enum(["COD", "BANK_TRANSFER", "PAYOS", "MOCK_PROVIDER"]),
  note: z.string().max(500).optional(),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
