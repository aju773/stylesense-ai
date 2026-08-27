import { Link, useNavigate } from "react-router";
import CartLineItem from "../components/cart/CartLineItem";
import CartSummary from "../components/cart/CartSummary";
import { useCart } from "../hooks/useCart";
import { useDocumentTitle } from "../hooks/useDocumentTitle";

export default function Cart() {
  useDocumentTitle("Your Bag");
  const { data: cart, isLoading, isError } = useCart();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="max-w-[1280px] mx-auto px-4 lg:px-8 py-24 text-center">
        <p className="text-sm tracking-[0.1em] uppercase text-[#777]">Loading…</p>
      </div>
    );
  }

  if (isError || !cart) {
    return (
      <div className="max-w-[1280px] mx-auto px-4 lg:px-8 py-24 text-center">
        <p className="text-sm text-[#D64045]">We couldn't load your bag.</p>
      </div>
    );
  }

  const { items, totals } = cart;

  if (items.length === 0) {
    return (
      <div className="max-w-[1280px] mx-auto px-4 lg:px-8 py-24 flex flex-col items-center gap-6">
        <h1 className="text-4xl font-display text-[#1A1A1A]">Your Bag</h1>
        <p className="text-sm text-[#777]">Nothing in here yet.</p>
        <Link
          to="/shop"
          className="h-[52px] px-8 bg-[#1A1A1A] text-white text-xs font-semibold tracking-[0.15em] uppercase hover:bg-[#333] transition-colors flex items-center"
        >
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-[1280px] mx-auto px-4 lg:px-8 py-12 pb-24">
      <div className="mb-10 flex items-baseline gap-4">
        <h1 className="text-4xl lg:text-5xl font-display text-[#1A1A1A]">
          Your Bag
        </h1>
        <span className="text-sm text-[#777]">
          ({totals.item_count} item{totals.item_count === 1 ? "" : "s"})
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        <div className="lg:col-span-8 flex flex-col">
          {items.map((item) => (
            <CartLineItem key={item.id} item={item} />
          ))}

          <Link
            to="/chat"
            className="mt-6 self-start text-xs font-semibold tracking-[0.15em] uppercase text-[#6366F1] hover:text-[#1A1A1A] transition-colors"
          >
            ✦ Ask AI for alternatives
          </Link>
        </div>

        <div className="lg:col-span-4">
          <div className="lg:sticky lg:top-24">
            <CartSummary totals={totals} onCheckout={() => navigate("/checkout")} />
          </div>
        </div>
      </div>
    </div>
  );
}
