"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

const MAX_IDS = 12;

interface RecentlyViewedState {
  productIds: string[];
  addProduct: (productId: string) => void;
  clear: () => void;
}

export const useRecentlyViewedStore = create<RecentlyViewedState>()(
  persist(
    (set) => ({
      productIds: [],
      addProduct: (productId) =>
        set((state) => {
          const filtered = state.productIds.filter((id) => id !== productId);
          return { productIds: [productId, ...filtered].slice(0, MAX_IDS) };
        }),
      clear: () => set({ productIds: [] }),
    }),
    {
      name: "recently-viewed",
      partialize: (state) => ({ productIds: state.productIds }),
    }
  )
);
