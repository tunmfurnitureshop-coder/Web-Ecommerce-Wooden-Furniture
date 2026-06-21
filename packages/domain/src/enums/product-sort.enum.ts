export const ProductSort = {
  NEWEST: "newest",
  PRICE_ASC: "price_asc",
  PRICE_DESC: "price_desc",
  RATING_DESC: "rating_desc",
  RELEVANCE: "relevance",
} as const;

export type ProductSort = (typeof ProductSort)[keyof typeof ProductSort];
