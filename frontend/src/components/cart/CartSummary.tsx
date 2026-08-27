import type { CartTotals } from "../../api/cart";
import { formatPrice } from "../../lib/product";

export default function CartSummary({
  totals,
  onCheckout,
}: {
  totals: CartTotals;
  onCheckout?: () => void;
}) {
  const hasDiscount = Number(totals.discount) > 0;

  return (
    <div className="bg-[#F9F7F4] border border-[#E5E5E5] p-6 flex flex-col gap-5">
      <h2 className="text-xs font-semibold tracking-[0.2em] uppercase text-[#1A1A1A]">
        Order Summary
      </h2>

      <div className="flex flex-col gap-3 border-b border-[#E5E5E5] pb-5">
        <div className="flex justify-between text-sm text-[#444]">
          <span>Subtotal</span>
          <span className="tabular-nums">{formatPrice(totals.subtotal)}</span>
        </div>
        {hasDiscount && (
          <div className="flex justify-between text-sm text-[#2D8A4E]">
            <span>Discount</span>
            <span className="tabular-nums">−{formatPrice(totals.discount)}</span>
          </div>
        )}
        <div className="flex justify-between text-sm text-[#444]">
          <span>Shipping</span>
          <span className="uppercase tracking-wider">
            {Number(totals.shipping) === 0 ? "Free" : formatPrice(totals.shipping)}
          </span>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <span className="text-base font-semibold text-[#1A1A1A]">Total</span>
        <span className="text-2xl font-display text-[#1A1A1A] tabular-nums">
          {formatPrice(totals.total)}
        </span>
      </div>

      <button
        type="button"
        onClick={onCheckout}
        disabled={totals.line_count === 0}
        className="w-full h-[52px] bg-[#1A1A1A] text-white text-xs font-semibold tracking-[0.15em] uppercase hover:bg-[#333] transition-colors disabled:opacity-40 disabled:hover:bg-[#1A1A1A]"
      >
        Checkout
      </button>

      <div className="flex justify-center gap-8 pt-4 border-t border-[#E5E5E5] text-[10px] uppercase tracking-wider text-[#777]">
        <span>Secure</span>
        <span>Free Ship</span>
        <span>Returns</span>
      </div>
    </div>
  );
}
