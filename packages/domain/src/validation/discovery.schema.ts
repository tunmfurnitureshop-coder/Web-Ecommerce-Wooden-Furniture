import { z } from "zod";

export const SearchFilterSchema = z.object({
  q: z.string().max(100).optional(),
  room: z.string().optional(),
  woodType: z.string().optional(),
  tags: z.string().optional(),
  availability: z.string().optional(),
  minPrice: z.coerce.number().int().min(0).optional(),
  maxPrice: z.coerce.number().int().min(0).optional(),
  ratingMin: z.coerce.number().min(1).max(5).optional(),
  sort: z.enum(["relevance", "price_asc", "price_desc", "newest", "rating_desc"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(12),
}).refine(
  (d) => !d.minPrice || !d.maxPrice || d.maxPrice > d.minPrice,
  { message: "maxPrice must be greater than minPrice", path: ["maxPrice"] }
);

export const RelatedProductSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  primaryImageUrl: z.string().nullable().optional(),
  basePriceVnd: z.number(),
  relationSource: z.enum(["manual", "category", "tags", "price_tier", "latest"]),
});

export const RecentlyViewedHydrationSchema = z.object({
  locale: z.string(),
  productIds: z.array(z.string()).max(12),
});

export const SearchSuggestionSchema = z.object({
  products: z.array(
    z.object({ slug: z.string(), name: z.string(), primaryImageUrl: z.string().nullable().optional() })
  ),
  categories: z.array(z.object({ code: z.string(), name: z.string() })),
  woodTypes: z.array(z.object({ code: z.string(), name: z.string() })),
  collections: z.array(z.object({ id: z.string(), name: z.string(), slug: z.string() })),
  tags: z.array(z.object({ code: z.string(), type: z.string(), name: z.string() })),
});

export type SearchFilterInput = z.infer<typeof SearchFilterSchema>;
export type RelatedProductInput = z.infer<typeof RelatedProductSchema>;
export type RecentlyViewedHydrationInput = z.infer<typeof RecentlyViewedHydrationSchema>;
