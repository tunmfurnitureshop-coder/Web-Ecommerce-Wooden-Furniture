export const Locale = {
  VI: "vi",
  ZH_CN: "zh-CN",
} as const;

export type Locale = (typeof Locale)[keyof typeof Locale];

export const CurrencyCode = {
  VND: "VND",
} as const;

export type CurrencyCode = (typeof CurrencyCode)[keyof typeof CurrencyCode];
