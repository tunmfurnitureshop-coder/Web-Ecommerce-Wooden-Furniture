import { describe, it, expect } from "vitest";
import { mapCartItemDTOtoViewModel } from "./cart.mapper";

const format = (n: number) => `₫${n.toLocaleString("vi-VN")}`;

const cartItemDTO = {
  productId: "prod-1",
  sku: "CHAIR-001-OAK-NATURAL-STANDARD",
  name: "Oak Dining Chair",
  imageUrl: "https://cdn.example.com/chair.jpg",
  quantity: 2,
  selectedOptions: {
    woodType: { code: "oak", label: "Gỗ Sồi" },
    finish: { code: "natural", label: "Tự nhiên" },
    size: { code: "standard", label: "Tiêu chuẩn" },
  },
  unitPriceVnd: 3_500_000,
  lineTotalVnd: 7_000_000,
};

describe("mapCartItemDTOtoViewModel", () => {
  it("maps all fields correctly", () => {
    const vm = mapCartItemDTOtoViewModel(cartItemDTO, format);
    expect(vm.id).toBe("CHAIR-001-OAK-NATURAL-STANDARD");
    expect(vm.productId).toBe("prod-1");
    expect(vm.productName).toBe("Oak Dining Chair");
    expect(vm.quantity).toBe(2);
    expect(vm.imageUrl).toBe("https://cdn.example.com/chair.jpg");
  });

  it("builds selectedOptionsLabel array", () => {
    const vm = mapCartItemDTOtoViewModel(cartItemDTO, format);
    expect(vm.selectedOptionsLabel).toEqual(["Gỗ Sồi", "Tự nhiên", "Tiêu chuẩn"]);
  });

  it("formats prices using the provided formatter function", () => {
    const vm = mapCartItemDTOtoViewModel(cartItemDTO, format);
    expect(vm.unitPriceFormatted).toBe(format(3_500_000));
    expect(vm.lineTotalFormatted).toBe(format(7_000_000));
  });

  it("uses placeholder when imageUrl is null", () => {
    const vm = mapCartItemDTOtoViewModel({ ...cartItemDTO, imageUrl: null }, format);
    expect(vm.imageUrl).toBe("/images/placeholder-product.jpg");
  });

  it("defaults availabilityState to AVAILABLE", () => {
    const vm = mapCartItemDTOtoViewModel(cartItemDTO, format);
    expect(vm.availabilityState).toBe("AVAILABLE");
  });
});
