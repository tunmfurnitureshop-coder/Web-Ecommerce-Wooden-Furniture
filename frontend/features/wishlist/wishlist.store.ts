"use client";

import { create } from "zustand";
import type { WishlistResponse } from "./wishlist.types";

interface WishlistStore {
  ids: Set<string>;
  loaded: boolean;
  load: (fetchFn: <T>(path: string, options?: RequestInit) => Promise<T>) => Promise<void>;
  add: (productId: string) => void;
  remove: (productId: string) => void;
  reset: () => void;
}

export const useWishlistStore = create<WishlistStore>((set, get) => ({
  ids: new Set<string>(),
  loaded: false,

  load: async (fetchFn) => {
    if (get().loaded) return;
    try {
      const data = await fetchFn<WishlistResponse>("/api/v1/customer/wishlist");
      set({ ids: new Set(data.items.map((i) => i.productId)), loaded: true });
    } catch {
      set({ loaded: true });
    }
  },

  add: (productId) =>
    set((s) => ({ ids: new Set(Array.from(s.ids).concat(productId)) })),

  remove: (productId) =>
    set((s) => {
      const next = new Set(s.ids);
      next.delete(productId);
      return { ids: next };
    }),

  reset: () => set({ ids: new Set(), loaded: false }),
}));
