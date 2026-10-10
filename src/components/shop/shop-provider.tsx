"use client";

import * as React from "react";
import type { CartLine } from "@/lib/types";
import * as cartStore from "@/lib/cart-store";

export type { AddItemInput } from "@/lib/cart-store";
export { lineKey } from "@/lib/cart-store";

interface ShopState {
  hydrated: boolean;
  lines: CartLine[];
  wishlist: string[];
  count: number;
  subtotal: number;
  addItem: (input: cartStore.AddItemInput, quantity?: number) => void;
  setQuantity: (key: string, quantity: number) => void;
  removeLine: (key: string) => void;
  clearCart: () => void;
  toggleWishlist: (productId: string) => void;
  isWishlisted: (productId: string) => boolean;
}

const ShopContext = React.createContext<ShopState | null>(null);

export function ShopProvider({ children }: { children: React.ReactNode }) {
  const snapshot = React.useSyncExternalStore(
    cartStore.subscribe,
    cartStore.getSnapshot,
    cartStore.getServerSnapshot,
  );

  const { lines, wishlist } = snapshot;
  const wishlistSet = React.useMemo(() => new Set(wishlist), [wishlist]);
  const hydrated = snapshot !== cartStore.getServerSnapshot();

  const value = React.useMemo<ShopState>(() => {
    const count = lines.reduce((sum, line) => sum + line.quantity, 0);
    const subtotal = lines.reduce((sum, line) => sum + line.quantity * Number(line.price), 0);
    return {
      hydrated,
      lines,
      wishlist,
      count,
      subtotal,
      addItem: cartStore.addItem,
      setQuantity: cartStore.setQuantity,
      removeLine: cartStore.removeLine,
      clearCart: cartStore.clearCart,
      toggleWishlist: cartStore.toggleWishlist,
      isWishlisted: (id: string) => wishlistSet.has(id),
    };
  }, [hydrated, lines, wishlist, wishlistSet]);

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
}

export function useShop(): ShopState {
  const context = React.useContext(ShopContext);
  if (!context) throw new Error("useShop must be used inside <ShopProvider>");
  return context;
}
