import { useState } from "react";
import { Link, useNavigate } from "react-router";
import {
  DECLINE_TOKEN,
  parsePlaceOrderError,
  type Order,
  type PlaceOrderFailure,
} from "../api/orders";
import { useCart } from "../hooks/useCart";
import { usePlaceOrder } from "../hooks/useOrders";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { formatPrice } from "../lib/product";
import ProductPhoto from "../components/common/ProductPhoto";

const DEMO_CARD = {
  number: "4242 4242 4242 4242",
  name: "DEMO CUSTOMER",
  expiry: "12 / 30",
  cvc: "•••",
};

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[10px] font-semibold tracking-[0.15em] uppercase text-[#777]">
        {label}
      </span>
      <div className="h-11 px-3 flex items-center bg-white border border-[#E5E5E5] text-sm text-[#444] tabular-nums">
        {value}
      </div>
    </div>
  );
}

function StockConflictNotice({ failure }: { failure: PlaceOrderFailure }) {
  if (failure.kind !== "stock") return null;

  return (
    <div className="border border-[#D64045]/40 bg-[#FDF3F3] p-5 flex flex-col gap-3">
      <p className="text-sm font-semibold text-[#D64045]">{failure.message}</p>
      <ul className="flex flex-col gap-2">
        {failure.lines.map((line) => (
          <li key={line.item_id} className="text-sm text-[#444]">
            <span className="font-semibold">{line.product_name}</span>
            {(line.size || line.color) && (
              <span className="text-[#777]">
                {" "}
                ({[line.color, line.size].filter(Boolean).join(" · ")})
              </span>
            )}
            {" — "}
            {line.reason === "unavailable" ? (
              <span>no longer available</span>
            ) : (
              <span>
                you asked for {line.requested}, only{" "}
                <span className="tabular-nums">{line.available}</span> left
              </span>
            )}
          </li>
        ))}
      </ul>
      <Link
        to="/cart"
        className="self-start text-xs font-semibold tracking-[0.15em] uppercase text-[#1A1A1A] border-b border-[#1A1A1A] pb-0.5 hover:text-[#777] hover:border-[#777] transition-colors"
      >
        Edit your bag
      </Link>
    </div>
  );
}

function Confirmation({ order }: { order: Order }) {
  return (
    <div className="max-w-[560px] mx-auto px-4 py-24 flex flex-col items-center text-center gap-6">
      <div className="w-14 h-14 rounded-full bg-[#E8F3EB] text-[#2D8A4E] flex items-center justify-center text-2xl">
        ✓
      </div>
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-display text-[#1A1A1A]">
          Order Confirmed
        </h1>
        <p className="text-sm text-[#777]">
          Thank you. We&apos;ve started preparing your order.
        </p>
      </div>

      <div className="w-full bg-[#F9F7F4] border border-[#E5E5E5] p-6 flex flex-col gap-3 text-left">
        <div className="flex justify-between text-sm">
          <span className="text-[#777]">Order</span>
          <span className="font-semibold text-[#1A1A1A]">{order.order_number}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-[#777]">Items</span>
          <span className="text-[#1A1A1A] tabular-nums">{order.item_count}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-[#777]">Status</span>
          <span className="text-[#1A1A1A]">{order.status_label}</span>
        </div>
        <div className="flex justify-between items-center pt-3 border-t border-[#E5E5E5]">
          <span className="text-base font-semibold text-[#1A1A1A]">Paid</span>
          <span className="text-2xl font-display text-[#1A1A1A] tabular-nums">
            {formatPrice(order.total)}
          </span>
        </div>
      </div>

      <div className="w-full flex flex-col sm:flex-row gap-3">
        <Link
          to="/orders"
          className="flex-1 h-[52px] bg-[#1A1A1A] text-white text-xs font-semibold tracking-[0.15em] uppercase hover:bg-[#333] transition-colors flex items-center justify-center"
        >
          View Orders
        </Link>
        <Link
          to="/shop"
          className="flex-1 h-[52px] border border-[#1A1A1A] text-[#1A1A1A] text-xs font-semibold tracking-[0.15em] uppercase hover:bg-[#F9F7F4] transition-colors flex items-center justify-center"
        >
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}

export default function Checkout() {
  useDocumentTitle("Checkout");
  const { data: cart, isLoading } = useCart();
  const placeOrder = usePlaceOrder();
  const navigate = useNavigate();

  const [simulateDecline, setSimulateDecline] = useState(false);
  const [failure, setFailure] = useState<PlaceOrderFailure | null>(null);
  const [order, setOrder] = useState<Order | null>(null);

  if (order) return <Confirmation order={order} />;

  if (isLoading) {
    return (
      <div className="max-w-[1280px] mx-auto px-4 lg:px-8 py-24 text-center">
        <p className="text-sm tracking-[0.1em] uppercase text-[#777]">Loading…</p>
      </div>
    );
  }

  const items = cart?.items ?? [];
  const totals = cart?.totals;

  if (!totals || items.length === 0) {
    return (
      <div className="max-w-[1280px] mx-auto px-4 lg:px-8 py-24 flex flex-col items-center gap-6">
        <h1 className="text-4xl font-display text-[#1A1A1A]">Checkout</h1>
        <p className="text-sm text-[#777]">Your bag is empty.</p>
        <Link
          to="/shop"
          className="h-[52px] px-8 bg-[#1A1A1A] text-white text-xs font-semibold tracking-[0.15em] uppercase hover:bg-[#333] transition-colors flex items-center"
        >
          Continue Shopping
        </Link>
      </div>
    );
  }

  const handlePay = () => {
    setFailure(null);
    placeOrder.mutate(
      { payment_token: simulateDecline ? DECLINE_TOKEN : "" },
      {
        onSuccess: (placed) => setOrder(placed),
        onError: (error) => {
          const parsed = parsePlaceOrderError(error);
          if (parsed.kind === "empty") {
            navigate("/cart");
            return;
          }
          setFailure(parsed);
        },
      }
    );
  };

  const isPaying = placeOrder.isPending;

  return (
    <div className="max-w-[1280px] mx-auto px-4 lg:px-8 py-12 pb-24">
      <div className="mb-10 flex items-baseline gap-4">
        <h1 className="text-4xl lg:text-5xl font-display text-[#1A1A1A]">
          Checkout
        </h1>
        <Link
          to="/cart"
          className="text-xs font-semibold tracking-[0.15em] uppercase text-[#777] hover:text-[#1A1A1A] transition-colors"
        >
          ← Back to bag
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        <div className="lg:col-span-7 flex flex-col gap-8">
          <section className="flex flex-col gap-4">
            <h2 className="text-xs font-semibold tracking-[0.2em] uppercase text-[#1A1A1A]">
              Payment
            </h2>

            <div className="border border-[#E5E5E5] bg-[#F9F7F4] p-6 flex flex-col gap-5">
              <p className="text-xs text-[#777] leading-relaxed">
                This is a demo storefront. No real payment is processed and these
                details are not sent anywhere — the mock gateway simply pauses,
                then answers.
              </p>

              <Field label="Card number" value={DEMO_CARD.number} />
              <div className="grid grid-cols-2 gap-4">
                <Field label="Expiry" value={DEMO_CARD.expiry} />
                <Field label="CVC" value={DEMO_CARD.cvc} />
              </div>
              <Field label="Name on card" value={DEMO_CARD.name} />

              <label className="flex items-start gap-3 pt-2 border-t border-[#E5E5E5] cursor-pointer">
                <input
                  type="checkbox"
                  checked={simulateDecline}
                  onChange={(event) => setSimulateDecline(event.target.checked)}
                  disabled={isPaying}
                  className="mt-0.5 w-4 h-4 accent-[#1A1A1A]"
                />
                <span className="flex flex-col gap-0.5">
                  <span className="text-sm text-[#1A1A1A]">
                    Simulate a declined payment
                  </span>
                  <span className="text-xs text-[#777]">
                    The order is rolled back in full — stock is put back and your
                    bag is left exactly as it is.
                  </span>
                </span>
              </label>
            </div>
          </section>

          {failure?.kind === "stock" && <StockConflictNotice failure={failure} />}

          {(failure?.kind === "declined" || failure?.kind === "unknown") && (
            <div className="border border-[#D64045]/40 bg-[#FDF3F3] p-5">
              <p className="text-sm text-[#D64045]">{failure.message}</p>
            </div>
          )}
        </div>

        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-24 bg-white border border-[#E5E5E5] p-6 flex flex-col gap-5">
            <h2 className="text-xs font-semibold tracking-[0.2em] uppercase text-[#1A1A1A]">
              Your Order
            </h2>

            <ul className="flex flex-col gap-4 max-h-[320px] overflow-y-auto">
              {items.map((item) => (
                <li key={item.id} className="flex gap-3">
                  <div className="w-12 aspect-[4/5] flex-none overflow-hidden">
                    <ProductPhoto
                      src={item.product.image_url}
                      alt=""
                      className="w-full h-full"
                    />
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5">
                    <span className="text-sm text-[#1A1A1A] truncate">
                      {item.product.name}
                    </span>
                    <span className="text-xs text-[#777]">
                      {[item.color, item.size].filter(Boolean).join(" · ")}
                      {(item.color || item.size) && " · "}Qty {item.quantity}
                    </span>
                  </div>
                  <span className="text-sm text-[#1A1A1A] tabular-nums self-center">
                    {formatPrice(item.line_total)}
                  </span>
                </li>
              ))}
            </ul>

            <div className="flex flex-col gap-3 border-t border-[#E5E5E5] pt-5">
              <div className="flex justify-between text-sm text-[#444]">
                <span>Subtotal</span>
                <span className="tabular-nums">{formatPrice(totals.subtotal)}</span>
              </div>
              {Number(totals.discount) > 0 && (
                <div className="flex justify-between text-sm text-[#2D8A4E]">
                  <span>Discount</span>
                  <span className="tabular-nums">−{formatPrice(totals.discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm text-[#444]">
                <span>Shipping</span>
                <span className="uppercase tracking-wider">
                  {Number(totals.shipping) === 0
                    ? "Free"
                    : formatPrice(totals.shipping)}
                </span>
              </div>
            </div>

            <div className="flex justify-between items-center border-t border-[#E5E5E5] pt-5">
              <span className="text-base font-semibold text-[#1A1A1A]">Total</span>
              <span className="text-2xl font-display text-[#1A1A1A] tabular-nums">
                {formatPrice(totals.total)}
              </span>
            </div>

            <button
              type="button"
              onClick={handlePay}
              disabled={isPaying}
              className="w-full h-[52px] bg-[#1A1A1A] text-white text-xs font-semibold tracking-[0.15em] uppercase hover:bg-[#333] transition-colors disabled:opacity-60 disabled:hover:bg-[#1A1A1A] flex items-center justify-center gap-2"
            >
              {isPaying ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Processing…
                </>
              ) : (
                `Pay ${formatPrice(totals.total)}`
              )}
            </button>

            <p className="text-[10px] text-center uppercase tracking-wider text-[#777]">
              Nothing is charged until every item is confirmed in stock
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
