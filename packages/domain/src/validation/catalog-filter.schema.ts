import { z } from "zod";
import { DEFAULT_PAGE_SIZE } from "../constants/app.constants";

export const catalogFilterSchema = z.object({
  q: z.string().max(100).optional(),
  room: z.string().optional(),
  woodType: z.string().optional(),
  minPrice: z.coerce.number().int().min(0).optional(),
  maxPrice: z.coerce.number().int().min(0).optional(),
  sort: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(DEFAULT_PAGE_SIZE),
}).refine(
  (d) => !d.minPrice || !d.maxPrice || d.maxPrice > d.minPrice,
  { message: "maxPrice must be greater than minPrice", path: ["maxPrice"] }
);

export type CatalogFilterInput = z.infer<typeof catalogFilterSchema>;
