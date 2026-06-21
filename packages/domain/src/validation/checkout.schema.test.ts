import { describe, it, expect } from "vitest";
import { checkoutSchema } from "./checkout.schema";

const validInput = {
  customerName: "Nguyen Van A",
  customerPhone: "0901234567",
  customerEmail: "user@example.com",
  shippingAddress: "123 Nguyen Trai, Quan 1, TP.HCM",
  paymentMethod: "COD" as const,
  note: "Giao buoi sang",
};

describe("checkoutSchema", () => {
  it("accepts valid COD order", () => {
    expect(checkoutSchema.safeParse(validInput).success).toBe(true);
  });

  it("accepts PAYOS payment method", () => {
    expect(checkoutSchema.safeParse({ ...validInput, paymentMethod: "PAYOS" }).success).toBe(true);
  });

  it("rejects invalid phone number", () => {
    const result = checkoutSchema.safeParse({ ...validInput, customerPhone: "0123456789" });
    expect(result.success).toBe(false);
  });

  it("rejects empty customerName", () => {
    expect(checkoutSchema.safeParse({ ...validInput, customerName: "" }).success).toBe(false);
  });

  it("rejects address shorter than 5 characters", () => {
    expect(checkoutSchema.safeParse({ ...validInput, shippingAddress: "123" }).success).toBe(false);
  });

  it("rejects invalid payment method", () => {
    expect(checkoutSchema.safeParse({ ...validInput, paymentMethod: "CRYPTO" }).success).toBe(false);
  });

  it("accepts empty email (optional field)", () => {
    expect(checkoutSchema.safeParse({ ...validInput, customerEmail: "" }).success).toBe(true);
  });
});
