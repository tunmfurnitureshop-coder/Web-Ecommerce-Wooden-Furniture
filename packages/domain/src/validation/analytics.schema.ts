import { z } from "zod";

const CLIENT_EVENT_NAMES = [
  "PRODUCT_VIEWED",
  "SEARCH_PERFORMED",
  "SEARCH_RESULT_CLICKED",
  "PRODUCT_ADDED_TO_CART",
  "PRODUCT_REMOVED_FROM_CART",
  "CART_VIEWED",
  "CHECKOUT_STARTED",
  "WISHLIST_ADDED",
  "WISHLIST_REMOVED",
] as const;

export const clientEventSchema = z.object({
  eventName: z.enum(CLIENT_EVENT_NAMES),
  anonymousId: z.string().max(128).optional(),
  sessionId: z.string().max(128).optional(),
  productId: z.string().uuid().optional(),
  promotionId: z.string().uuid().optional(),
  campaignId: z.string().uuid().optional(),
  locale: z.string().max(10).optional(),
  sourcePage: z.string().max(500).optional(),
  referrer: z.string().max(500).optional(),
  payload: z.record(z.unknown()).optional(),
});

export type ClientEventInput = z.infer<typeof clientEventSchema>;
