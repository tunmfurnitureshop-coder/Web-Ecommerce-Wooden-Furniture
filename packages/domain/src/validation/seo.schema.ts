import { z } from "zod";

export const SeoMetadataSchema = z.object({
  meta_title: z.string().max(180).nullable().optional(),
  meta_description: z.string().max(320).nullable().optional(),
  og_title: z.string().max(180).nullable().optional(),
  og_description: z.string().max(320).nullable().optional(),
  og_image_url: z.string().nullable().optional(),
  canonical_url: z.string().nullable().optional(),
});

export type SeoMetadataInput = z.infer<typeof SeoMetadataSchema>;
