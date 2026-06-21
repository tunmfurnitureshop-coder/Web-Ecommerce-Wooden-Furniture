import { z } from "zod";

export const profileSchema = z.object({
  fullName: z.string().max(100).optional(),
  phone: z
    .string()
    .regex(/^(03|05|07|08|09)[0-9]{8}$/)
    .optional()
    .or(z.literal("")),
});

export type ProfileInput = z.infer<typeof profileSchema>;
