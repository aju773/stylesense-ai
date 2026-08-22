import { useState } from "react";
import { Link } from "react-router";
import OrderCard from "../components/orders/OrderCard";
import { useOrders } from "../hooks/useOrders";

export default function Orders() {
  const { data: orders, isLoading, isError } = useOrders();
  // The newest order is the one you came here to look at, so it starts open.
  // `null` means "nothing open"; undefined means "not chosen yet".
  const [expandedId, setExpandedId] = useState<number | null | undefined>(undefined);

  if (isLoading) {
    return (
      <div className="max-w-[1280px] mx-auto px-4 lg:px-8 py-24 text-center">
        <p className="text-sm tracking-[0.1em] uppercase text-[#777]">Loading…</p>
      </div>
    );
  }

  if (isError || !orders) {
    return (
      <div className="max-w-[1280px] mx-auto px-4 lg:px-8 py-24 text-center">
        <p className="text-sm text-[#D64045]">We couldn&apos;t load your orders.</p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="max-w-[1280px] mx-auto px-4 lg:px-8 py-24 flex flex-col items-center gap-6">
        <h1 className="text-4xl font-['Playfair_Display'] text-[#1A1A1A]">My Orders</h1>
        <p className="text-sm text-[#777]">You haven&apos;t placed an order yet.</p>
        <Link
          to="/shop"
          className="h-[52px] px-8 bg-[#1A1A1A] text-white text-xs font-semibold tracking-[0.15em] uppercase hover:bg-[#333] transition-colors flex items-center"
        >
          Start Shopping
        </Link>
      </div>
    );
  }

  const openId = expandedId === undefined ? orders[0].id : expandedId;

  return (
    <div className="max-w-[1280px] mx-auto px-4 lg:px-8 py-12 pb-24">
      <header className="mb-12">
        <h1 className="text-4xl lg:text-5xl font-['Playfair_Display'] text-[#1A1A1A] mb-2">
          My Orders
        </h1>
        <p className="text-base text-[#777]">
          View and manage your recent purchases
        </p>
      </header>

      <div className="flex flex-col gap-8">
        {orders.map((order) => (
          <OrderCard
            key={order.id}
            order={order}
            isExpanded={order.id === openId}
            onToggle={() => setExpandedId(order.id === openId ? null : order.id)}
          />
        ))}
      </div>
    </div>
  );
}
