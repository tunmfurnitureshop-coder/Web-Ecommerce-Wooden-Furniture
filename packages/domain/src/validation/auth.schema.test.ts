import { describe, it, expect } from "vitest";
import { loginSchema, registerSchema, resetPasswordSchema, forgotPasswordSchema } from "./auth.schema";

describe("loginSchema", () => {
  it("accepts valid email and password", () => {
    expect(loginSchema.safeParse({ email: "user@example.com", password: "secret" }).success).toBe(true);
  });

  it("rejects invalid email", () => {
    expect(loginSchema.safeParse({ email: "not-an-email", password: "secret" }).success).toBe(false);
  });

  it("rejects empty password", () => {
    expect(loginSchema.safeParse({ email: "user@example.com", password: "" }).success).toBe(false);
  });
});

describe("registerSchema", () => {
  it("accepts valid registration with all fields", () => {
    const result = registerSchema.safeParse({
      email: "user@example.com",
      password: "strongpass1",
      fullName: "Nguyen Van A",
      phone: "0901234567",
    });
    expect(result.success).toBe(true);
  });

  it("rejects password shorter than 8 characters", () => {
    expect(registerSchema.safeParse({ email: "user@example.com", password: "short" }).success).toBe(false);
  });

  it("rejects invalid Vietnamese phone", () => {
    expect(registerSchema.safeParse({
      email: "user@example.com",
      password: "strongpass1",
      phone: "1234567890",
    }).success).toBe(false);
  });

  it("accepts empty string phone (optional field)", () => {
    expect(registerSchema.safeParse({
      email: "user@example.com",
      password: "strongpass1",
      phone: "",
    }).success).toBe(true);
  });
});

describe("resetPasswordSchema", () => {
  it("accepts matching passwords", () => {
    const result = resetPasswordSchema.safeParse({
      token: "abc123",
      newPassword: "newstrongpass",
      confirmPassword: "newstrongpass",
    });
    expect(result.success).toBe(true);
  });

  it("rejects mismatched passwords", () => {
    const result = resetPasswordSchema.safeParse({
      token: "abc123",
      newPassword: "newstrongpass",
      confirmPassword: "differentpass",
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path).toContain("confirmPassword");
  });
});

describe("forgotPasswordSchema", () => {
  it("accepts valid email", () => {
    expect(forgotPasswordSchema.safeParse({ email: "user@example.com" }).success).toBe(true);
  });

  it("rejects invalid email", () => {
    expect(forgotPasswordSchema.safeParse({ email: "not-email" }).success).toBe(false);
  });
});
