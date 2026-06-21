export const PaymentMethod = {
  COD: "COD",
  BANK_TRANSFER: "BANK_TRANSFER",
  PAYOS: "PAYOS",
  MOCK_PROVIDER: "MOCK_PROVIDER",
} as const;

export type PaymentMethod = (typeof PaymentMethod)[keyof typeof PaymentMethod];
