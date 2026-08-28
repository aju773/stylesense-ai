import { Link } from "react-router";
import type { Order, OrderItem } from "../../api/orders";
import { formatPrice } from "../../lib/product";
import ProductPhoto from "../common/ProductPhoto";
import OrderStatusPill from "./OrderStatusPill";
import OrderTracker from "./OrderTracker";

function formatPlacedAt(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function Thumb({ item, size }: { item: OrderItem; size: "sm" | "md" }) {
  const box = size === "sm" ? "w-12 aspect-[4/5]" : "w-[72px] aspect-[4/5]";

  return (
    <div className={`${box} flex-none overflow-hidden`}>
      <ProductPhoto src={item.image_url} alt="" className="w-full h-full" />
    </div>
  );
}

/**
 * A purchased line renders from the order's own snapshot, never from the live
 * catalog. `product_id` goes null if the product is later deleted, which is
 * exactly when the name still has to be readable — so the link is conditional
 * and the text is not.
 */
function LineItem({ item }: { item: OrderItem }) {
  const saved = Number(item.list_price) - Number(item.unit_price);

  return (
    <li className="flex gap-4">
      <Thumb item={item} size="md" />
      <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
        <div className="flex flex-col gap-1">
          <div className="flex justify-between items-start gap-4">
            {item.product_id ? (
              <Link
                to={`/products/${item.product_slug}`}
                className="text-sm font-semibold text-[#1A1A1A] hover:text-[#777] transition-colors"
              >
                {item.product_name}
              </Link>
            ) : (
              <span className="text-sm font-semibold text-[#1A1A1A]">
                {item.product_name}
              </span>
            )}
            <span className="text-sm font-semibold text-[#1A1A1A] tabular-nums whitespace-nowrap">
              {formatPrice(item.line_total)}
            </span>
          </div>
          <span className="text-xs text-[#777]">
            {[
              item.color && `Color: ${item.color}`,
              item.size && `Size: ${item.size}`,
            ]
              .filter(Boolean)
              .join(" | ") || item.product_brand}
          </span>
        </div>
        <div className="flex justify-between items-end gap-4">
          <span className="text-xs text-[#444]">Qty: {item.quantity}</span>
          {saved > 0 && (
            <span className="text-xs text-[#2D8A4E] tabular-nums">
              Saved {formatPrice(String(saved * item.quantity))}
            </span>
          )}
        </div>
      </div>
    </li>
  );
}

export default function OrderCard({
  order,
  isExpanded,
  onToggle,
}: {
  order: Order;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const panelId = `order-panel-${order.id}`;

  return (
    <article className="bg-[#F9F7F4] border border-[#E5E5E5] shadow-sm hover:shadow-md transition-shadow">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isExpanded}
        aria-controls={panelId}
        className="w-full p-6 md:p-8 flex flex-col gap-6 text-left cursor-pointer"
      >
        <div className="w-full flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="text-lg font-display text-[#1A1A1A] mb-1">
              Order {order.order_number}
            </div>
            <div className="text-sm text-[#777]">
              Placed on {formatPlacedAt(order.placed_at)}
            </div>
          </div>
          <OrderStatusPill status={order.status} label={order.status_label} />
        </div>

        {!isExpanded && (
          <div className="w-full flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <div className="flex gap-2">
                {order.items.slice(0, 3).map((item) => (
                  <Thumb key={item.id} item={item} size="sm" />
                ))}
              </div>
              <span className="text-sm text-[#777] whitespace-nowrap">
                {order.item_count} item{order.item_count === 1 ? "" : "s"}
              </span>
            </div>
            <div className="flex items-center gap-6">
              <span className="text-base font-semibold text-[#1A1A1A] tabular-nums">
                {formatPrice(order.total)}
              </span>
              <span className="hidden md:inline text-[11px] font-semibold tracking-[0.15em] uppercase text-[#1A1A1A]">
                View Details
              </span>
              <span className="md:hidden text-[#1A1A1A]">›</span>
            </div>
          </div>
        )}
      </button>

      {isExpanded && (
        <div id={panelId} className="px-6 md:px-8 pb-8">
          <OrderTracker status={order.status} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2">
              <h3 className="text-base font-display text-[#1A1A1A] mb-5">
                Items ({order.item_count})
              </h3>
              <ul className="flex flex-col gap-6">
                {order.items.map((item) => (
                  <LineItem key={item.id} item={item} />
                ))}
              </ul>
            </div>

            <div className="lg:col-span-1">
              <h3 className="text-base font-display text-[#1A1A1A] mb-4">
                Order Summary
              </h3>
              <div className="flex flex-col gap-2">
                <div className="flex justify-between text-sm text-[#777]">
                  <span>Subtotal</span>
                  <span className="tabular-nums">{formatPrice(order.subtotal)}</span>
                </div>
                {Number(order.discount) > 0 && (
                  <div className="flex justify-between text-sm text-[#2D8A4E]">
                    <span>Discount</span>
                    <span className="tabular-nums">
                      −{formatPrice(order.discount)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-sm text-[#777]">
                  <span>Shipping</span>
                  <span className="uppercase tracking-wider">
                    {Number(order.shipping) === 0
                      ? "Free"
                      : formatPrice(order.shipping)}
                  </span>
                </div>
                <div className="flex justify-between text-base font-semibold text-[#1A1A1A] pt-3 mt-1 border-t border-[#E5E5E5]">
                  <span>Total</span>
                  <span className="tabular-nums">{formatPrice(order.total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}
