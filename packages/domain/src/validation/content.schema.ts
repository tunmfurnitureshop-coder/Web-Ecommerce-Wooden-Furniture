import { z } from "zod";

export const ContentTypeSchema = z.enum([
  "BUYING_GUIDE", "MATERIAL_GUIDE", "CARE_GUIDE", "ROOM_INSPIRATION", "NEWS",
]);

export const ContentStatusSchema = z.enum([
  "DRAFT", "SCHEDULED", "PUBLISHED", "ARCHIVED",
]);

export const ContentListItemSchema = z.object({
  id: z.string(),
  type: ContentTypeSchema,
  title: z.string(),
  slug: z.string(),
  excerpt: z.string().nullable().optional(),
  coverImageUrl: z.string().nullable().optional(),
  authorName: z.string().nullable().optional(),
  publishedAt: z.string().nullable().optional(),
});

export const ContentDetailSchema = z.object({
  id: z.string(),
  type: ContentTypeSchema,
  title: z.string(),
  slug: z.string(),
  excerpt: z.string().nullable().optional(),
  body_markdown: z.string(),
  coverImageUrl: z.string().nullable().optional(),
  authorName: z.string().nullable().optional(),
  publishedAt: z.string().nullable().optional(),
  linkedProducts: z.array(z.record(z.unknown())),
  linkedCategories: z.array(z.record(z.unknown())),
  seo: z.record(z.unknown()),
  breadcrumbs: z.array(z.object({ name: z.string(), href: z.string() })),
  relatedGuides: z.array(z.record(z.unknown())),
});

export type ContentType = z.infer<typeof ContentTypeSchema>;
export type ContentListItemInput = z.infer<typeof ContentListItemSchema>;
