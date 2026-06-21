import { describe, it, expect } from "vitest";
import { catalogFilterSchema } from "./catalog-filter.schema";

describe("catalogFilterSchema", () => {
  it("applies defaults for page and pageSize", () => {
    const result = catalogFilterSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
      expect(result.data.pageSize).toBe(24);
    }
  });

  it("accepts valid filter with all fields", () => {
    const result = catalogFilterSchema.safeParse({
      q: "oak chair",
      room: "living_room",
      woodType: "oak",
      minPrice: "1000000",
      maxPrice: "5000000",
      sort: "price_asc",
      page: "2",
      pageSize: "12",
    });
    expect(result.success).toBe(true);
  });

  it("rejects when maxPrice is not greater than minPrice", () => {
    const result = catalogFilterSchema.safeParse({
      minPrice: "5000000",
      maxPrice: "3000000",
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path).toContain("maxPrice");
  });

  it("rejects pageSize greater than 100", () => {
    expect(catalogFilterSchema.safeParse({ pageSize: "200" }).success).toBe(false);
  });

  it("rejects page less than 1", () => {
    expect(catalogFilterSchema.safeParse({ page: "0" }).success).toBe(false);
  });
});
