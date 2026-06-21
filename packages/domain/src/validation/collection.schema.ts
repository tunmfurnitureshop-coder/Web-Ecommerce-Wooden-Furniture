import { z } from "zod";

export const CollectionStatusSchema = z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]);

export const CollectionListItemSchema = z.object({
  id: z.string().uuid(),
  code: z.string(),
  name: z.string(),
  slug: z.string(),
  shortDescription: z.string().nullable(),
  coverImageUrl: z.string().nullable(),
  productCount: z.number().default(0),
  publishedAt: z.string().nullable(),
});

export const CollectionDetailSchema = z.object({
  id: z.string().uuid(),
  code: z.string(),
  name: z.string(),
  slug: z.string(),
  shortDescription: z.string().nullable(),
  description: z.string().nullable(),
  coverImageUrl: z.string().nullable(),
  publishedAt: z.string().nullable(),
  products: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      slug: z.string(),
      basePriceVnd: z.number(),
      primaryImageUrl: z.string().nullable(),
    })
  ),
  seo: z.record(z.unknown()).optional(),
  breadcrumbs: z.array(z.object({ name: z.string(), href: z.string() })),
});

export type CollectionStatus = z.infer<typeof CollectionStatusSchema>;
export type CollectionListItemInput = z.infer<typeof CollectionListItemSchema>;
