export const APP_LOCALES = ["vi", "zh-CN"] as const;
export type AppLocale = (typeof APP_LOCALES)[number];

export const DEFAULT_LOCALE: AppLocale = "vi";
export const DEFAULT_CURRENCY = "VND";
export const DEFAULT_PAGE_SIZE = 24;
export const SEARCH_DEBOUNCE_MS = 300;
export const RECENT_SEARCHES_KEY = "vin_recent_searches";
export const MAX_RECENT_SEARCHES = 5;
export const PRODUCT_IMAGE_ASPECT_RATIO = 4 / 5;
