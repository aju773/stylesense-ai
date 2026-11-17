import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";

interface CartUIContextType {
  isDrawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
}

const CartUIContext = createContext<CartUIContextType | null>(null);

export function CartUIProvider({ children }: { children: ReactNode }) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const openDrawer = useCallback(() => setIsDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setIsDrawerOpen(false), []);

  const value = useMemo(
    () => ({ isDrawerOpen, openDrawer, closeDrawer }),
    [isDrawerOpen, openDrawer, closeDrawer]
  );

  return <CartUIContext.Provider value={value}>{children}</CartUIContext.Provider>;
}

export function useCartUI(): CartUIContextType {
  const context = useContext(CartUIContext);
  if (context === null) {
    throw new Error("useCartUI must be used within a CartUIProvider");
  }
  return context;
}
