import { z } from "zod";

export const searchSchema = z.object({
  query: z.string().min(2).max(100),
  limit: z.number().int().min(1).max(20).default(6),
});

export type SearchInput = z.infer<typeof searchSchema>;
