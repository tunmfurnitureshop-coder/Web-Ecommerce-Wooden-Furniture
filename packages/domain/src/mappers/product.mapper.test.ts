import { describe, it, expect } from "vitest";
import { mapProductCardDTOtoViewModel, mapProductDetailDTOtoViewModel } from "./product.mapper";

const catalogItemDTO = {
  id: "prod-1",
  sku: "CHAIR-001",
  name: "Oak Dining Chair",
  slug: "oak-dining-chair",
  basePriceVnd: 3_500_000,
  primaryImageUrl: "https://cdn.example.com/chair.jpg",
  shortDescription: "Classic oak dining chair",
  averageRating: 4.5,
  reviewCount: 12,
  room: { slug: "dining_room" },
};

const detailDTO = {
  id: "prod-1",
  sku: "CHAIR-001",
  name: "Oak Dining Chair",
  slug: "oak-dining-chair",
  description: "A beautifully crafted dining chair",
  basePriceVnd: 3_500_000,
  primaryImageUrl: "https://cdn.example.com/chair.jpg",
  availableOptions: {
    woodTypes: [{ code: "oak", name: "Gỗ Sồi", priceDeltaVnd: 0 }],
    finishes: [{ code: "natural", name: "Tự nhiên", priceDeltaVnd: 0 }],
    sizes: [{ code: "standard", name: "Tiêu chuẩn", priceDeltaVnd: 0, widthCm: 45, depthCm: 45, heightCm: 90 }],
  },
  images: [
    { id: "img-1", imageUrl: "https://cdn.example.com/chair.jpg", altText: "Oak Chair", sortOrder: 0, isPrimary: true, linkedFinishCode: null },
  ],
};

describe("mapProductCardDTOtoViewModel", () => {
  it("maps required fields correctly", () => {
    const vm = mapProductCardDTOtoViewModel(catalogItemDTO);
    expect(vm.id).toBe("prod-1");
    expect(vm.slug).toBe("oak-dining-chair");
    expect(vm.name).toBe("Oak Dining Chair");
    expect(vm.basePriceVnd).toBe(3_500_000);
    expect(vm.imageUrl).toBe("https://cdn.example.com/chair.jpg");
  });

  it("maps rating and reviewCount", () => {
    const vm = mapProductCardDTOtoViewModel(catalogItemDTO);
    expect(vm.averageRating).toBe(4.5);
    expect(vm.reviewCount).toBe(12);
  });

  it("maps roomSlug from room object", () => {
    const vm = mapProductCardDTOtoViewModel(catalogItemDTO);
    expect(vm.roomSlug).toBe("dining_room");
  });

  it("returns null imageUrl when primaryImageUrl is null", () => {
    const vm = mapProductCardDTOtoViewModel({ ...catalogItemDTO, primaryImageUrl: null });
    expect(vm.imageUrl).toBeNull();
  });

  it("returns undefined averageRating when null in DTO", () => {
    const vm = mapProductCardDTOtoViewModel({ ...catalogItemDTO, averageRating: null });
    expect(vm.averageRating).toBeUndefined();
  });
});

describe("mapProductDetailDTOtoViewModel", () => {
  it("maps core product fields", () => {
    const vm = mapProductDetailDTOtoViewModel(detailDTO);
    expect(vm.id).toBe("prod-1");
    expect(vm.sku).toBe("CHAIR-001");
    expect(vm.description).toBe("A beautifully crafted dining chair");
    expect(vm.basePriceVnd).toBe(3_500_000);
  });

  it("maps availableOptions correctly", () => {
    const vm = mapProductDetailDTOtoViewModel(detailDTO);
    expect(vm.availableOptions.woodTypes).toHaveLength(1);
    expect(vm.availableOptions.woodTypes[0].code).toBe("oak");
    expect(vm.availableOptions.sizes[0].widthCm).toBe(45);
  });

  it("maps images array correctly", () => {
    const vm = mapProductDetailDTOtoViewModel(detailDTO);
    expect(vm.images).toHaveLength(1);
    expect(vm.images[0].isPrimary).toBe(true);
  });
});
