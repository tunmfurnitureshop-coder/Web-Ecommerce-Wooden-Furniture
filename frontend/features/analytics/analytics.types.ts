export const CLIENT_EVENT_NAMES = [
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

export type ClientEventName = (typeof CLIENT_EVENT_NAMES)[number];

export interface TrackEventRequest {
  eventName: ClientEventName;
  anonymousId?: string;
  sessionId?: string;
  productId?: string;
  promotionId?: string;
  campaignId?: string;
  locale?: string;
  sourcePage?: string;
  referrer?: string;
  payload?: Record<string, unknown>;
}
