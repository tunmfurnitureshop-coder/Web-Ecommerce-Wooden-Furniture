import { z } from "zod";

export const TagTypeSchema = z.enum([
  "STYLE", "MATERIAL", "ROOM", "USAGE",
  "CAPACITY", "PRICE_TIER", "FEATURE", "AVAILABILITY",
]);

export const TagSchema = z.object({
  id: z.string().uuid(),
  code: z.string(),
  type: TagTypeSchema,
  isActive: z.boolean(),
  sortOrder: z.number(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
});

export const TagTranslationSchema = z.object({
  locale: z.string(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
});

export type TagType = z.infer<typeof TagTypeSchema>;
export type TagInput = z.infer<typeof TagSchema>;
