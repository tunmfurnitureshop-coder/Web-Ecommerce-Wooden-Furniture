import { z } from "zod";

export const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  title: z.string().max(100).optional(),
  content: z.string().max(1000).optional(),
});

export type ReviewInput = z.infer<typeof reviewSchema>;
