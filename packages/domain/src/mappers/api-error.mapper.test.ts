import { describe, it, expect } from "vitest";
import { mapApiFieldErrorsToFormErrors, extractApiErrorMessage } from "./api-error.mapper";

describe("mapApiFieldErrorsToFormErrors", () => {
  it("returns empty object when undefined", () => {
    expect(mapApiFieldErrorsToFormErrors(undefined)).toEqual({});
  });

  it("maps single field error", () => {
    const result = mapApiFieldErrorsToFormErrors({ email: ["Invalid email address"] });
    expect(result).toEqual({ email: { message: "Invalid email address" } });
  });

  it("maps multiple field errors, taking first message per field", () => {
    const result = mapApiFieldErrorsToFormErrors({
      email: ["Must be valid email", "Already in use"],
      password: ["Too short"],
    });
    expect(result.email).toEqual({ message: "Must be valid email" });
    expect(result.password).toEqual({ message: "Too short" });
  });

  it("uses fallback message when errors array is empty", () => {
    const result = mapApiFieldErrorsToFormErrors({ name: [] });
    expect(result.name).toEqual({ message: "Invalid value" });
  });
});

describe("extractApiErrorMessage", () => {
  it("extracts string detail", () => {
    const msg = extractApiErrorMessage({ detail: "Order not found" });
    expect(msg).toBe("Order not found");
  });

  it("extracts first item from array detail", () => {
    const msg = extractApiErrorMessage({
      detail: [{ loc: ["body", "email"], msg: "field required", type: "missing" }],
    });
    expect(msg).toBe("field required");
  });

  it("extracts Error message", () => {
    const msg = extractApiErrorMessage(new Error("Network error"));
    expect(msg).toBe("Network error");
  });

  it("returns generic message for unknown error", () => {
    const msg = extractApiErrorMessage(null);
    expect(msg).toBe("An unexpected error occurred");
  });
});
