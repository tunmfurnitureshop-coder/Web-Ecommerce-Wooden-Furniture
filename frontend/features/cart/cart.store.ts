"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem } from "./cart.types";
import { cartItemKey } from "./cart.types";

interface CartStore {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (key: string) => void;
  updateQuantity: (key: string, quantity: number) => void;
  clearCart: () => void;
  getItems: () => CartItem[];
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (newItem) => {
        const key = cartItemKey(newItem);
        set((state) => {
          const existing = state.items.find(
            (i) => cartItemKey(i) === key
          );
          if (existing) {
            return {
              items: state.items.map((i) =>
                cartItemKey(i) === key
                  ? { ...i, quantity: i.quantity + newItem.quantity }
                  : i
              ),
            };
          }
          return { items: [...state.items, newItem] };
        });
      },

      removeItem: (key) => {
        set((state) => ({
          items: state.items.filter((i) => cartItemKey(i) !== key),
        }));
      },

      updateQuantity: (key, quantity) => {
        if (quantity <= 0) {
          get().removeItem(key);
          return;
        }
        set((state) => ({
          items: state.items.map((i) =>
            cartItemKey(i) === key ? { ...i, quantity } : i
          ),
        }));
      },

      clearCart: () => set({ items: [] }),

      getItems: () => get().items,
    }),
    {
      name: "cart-storage",
      partialize: (state) => ({ items: state.items }),
    }
  )
);
