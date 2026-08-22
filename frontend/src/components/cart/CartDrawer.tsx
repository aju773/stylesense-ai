import { useEffect } from "react";
import { Link } from "react-router";
import { useCartUI } from "../../context/CartUIContext";
import { useCart } from "../../hooks/useCart";
import { formatPrice } from "../../lib/product";
import CartLineItem from "./CartLineItem";

export default function CartDrawer() {
  const { isDrawerOpen, closeDrawer } = useCartUI();
  const { data: cart, isLoading } = useCart();

  // Escape closes, and the page behind must not scroll while the panel is up.
  useEffect(() => {
    if (!isDrawerOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeDrawer();
    };
    document.addEventListener("keydown", onKeyDown);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isDrawerOpen, closeDrawer]);

  const items = cart?.items ?? [];
  const totals = cart?.totals;

  return (
    <>
      {/* Scrim. Rendered always so opacity can transition; pointer-events-none
          when closed keeps it from swallowing clicks on the page underneath. */}
      <div
        onClick={closeDrawer}
        aria-hidden="true"
        className={`fixed inset-0 z-40 bg-black/30 transition-opacity duration-300 ${
          isDrawerOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Shopping bag"
        aria-hidden={!isDrawerOpen}
        className={`fixed top-0 right-0 z-50 h-full w-full sm:w-[420px] bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-out ${
          isDrawerOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <header className="flex items-center justify-between px-6 h-20 border-b border-[#E5E5E5] flex-none">
          <h2 className="text-sm font-semibold tracking-[0.2em] uppercase text-[#1A1A1A]">
            Your Bag
            {totals && totals.item_count > 0 && (
              <span className="text-[#777] font-normal normal-case tracking-normal ml-2">
                ({totals.item_count})
              </span>
            )}
          </h2>
          <button
            type="button"
            onClick={closeDrawer}
            aria-label="Close bag"
            className="w-9 h-9 flex items-center justify-center text-2xl leading-none text-[#777] hover:text-[#1A1A1A] hover:bg-[#F9F7F4] rounded-full transition-colors"
          >
            ×
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-6">
          {isLoading ? (
            <p className="text-sm text-[#777] py-12 text-center">Loading…</p>
          ) : items.length === 0 ? (
            <div className="py-16 text-center flex flex-col items-center gap-4">
              <p className="text-sm text-[#777]">Your bag is empty.</p>
              <Link
                to="/shop"
                onClick={closeDrawer}
                className="text-xs font-semibold tracking-[0.15em] uppercase text-[#1A1A1A] border-b border-[#1A1A1A] pb-1 hover:text-[#777] hover:border-[#777] transition-colors"
              >
                Continue Shopping
              </Link>
            </div>
          ) : (
            items.map((item) => (
              <CartLineItem
                key={item.id}
                item={item}
                compact
                onNavigate={closeDrawer}
              />
            ))
          )}
        </div>

        {items.length > 0 && totals && (
          <footer className="flex-none border-t border-[#E5E5E5] px-6 py-5 flex flex-col gap-4 bg-[#F9F7F4]">
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold text-[#1A1A1A]">Total</span>
              <span className="text-xl font-['Playfair_Display'] text-[#1A1A1A] tabular-nums">
                {formatPrice(totals.total)}
              </span>
            </div>
            {Number(totals.discount) > 0 && (
              <p className="text-xs text-[#2D8A4E] -mt-2">
                You save {formatPrice(totals.discount)}
              </p>
            )}
            <Link
              to="/checkout"
              onClick={closeDrawer}
              className="w-full h-[52px] bg-[#1A1A1A] text-white text-xs font-semibold tracking-[0.15em] uppercase hover:bg-[#333] transition-colors flex items-center justify-center"
            >
              Checkout
            </Link>
            <Link
              to="/cart"
              onClick={closeDrawer}
              className="text-center text-xs font-semibold tracking-[0.15em] uppercase text-[#777] hover:text-[#1A1A1A] transition-colors"
            >
              View Bag
            </Link>
          </footer>
        )}
      </aside>
    </>
  );
}
