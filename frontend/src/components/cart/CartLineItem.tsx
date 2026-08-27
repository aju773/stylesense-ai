import { Link } from "react-router";
import type { CartItem } from "../../api/cart";
import { useRemoveCartItem, useUpdateCartItem } from "../../hooks/useCart";
import { formatPrice, getGradient } from "../../lib/product";

const MAX_QUANTITY = 10;

function QuantityStepper({
  quantity,
  onChange,
  disabled,
}: {
  quantity: number;
  onChange: (next: number) => void;
  disabled: boolean;
}) {
  return (
    <div className="flex items-center border border-[#E5E5E5]">
      <button
        type="button"
        aria-label="Decrease quantity"
        // Going below 1 is the "remove" action, not a quantity — the server
        // rejects 0, so the button stops here and Remove handles the rest.
        disabled={disabled || quantity <= 1}
        onClick={() => onChange(quantity - 1)}
        className="w-8 h-8 flex items-center justify-center text-lg leading-none text-[#777] hover:text-[#1A1A1A] hover:bg-[#F9F7F4] transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
      >
        −
      </button>
      <span className="text-sm w-8 text-center tabular-nums">{quantity}</span>
      <button
        type="button"
        aria-label="Increase quantity"
        disabled={disabled || quantity >= MAX_QUANTITY}
        onClick={() => onChange(quantity + 1)}
        className="w-8 h-8 flex items-center justify-center text-lg leading-none text-[#777] hover:text-[#1A1A1A] hover:bg-[#F9F7F4] transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
      >
        +
      </button>
    </div>
  );
}

export default function CartLineItem({
  item,
  compact = false,
  onNavigate,
}: {
  item: CartItem;
  /** Drawer layout — narrower thumbnail, stacked meta. */
  compact?: boolean;
  onNavigate?: () => void;
}) {
  const updateItem = useUpdateCartItem();
  const removeItem = useRemoveCartItem();

  // A placeholder line from an optimistic add has no server row yet, so there
  // is nothing to PATCH or DELETE until the response lands.
  const isPending = item.id < 0 || updateItem.isPending || removeItem.isPending;

  const listPrice = Number(item.product.price);
  const paidPrice = Number(item.unit_price);
  const savings = (listPrice - paidPrice) * item.quantity;

  const thumbSize = compact ? "w-[72px] h-[96px]" : "w-[100px] h-[130px]";

  return (
    <div className="flex gap-4 py-4 border-b border-[#E5E5E5]">
      <Link
        to={`/products/${item.product.slug}`}
        onClick={onNavigate}
        className={`${thumbSize} flex-none overflow-hidden bg-[#F5F5F5] rounded-sm`}
      >
        {item.product.image_url ? (
          <img
            src={item.product.image_url}
            alt={item.product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div
            className={`w-full h-full bg-gradient-to-br ${getGradient(
              item.product.name
            )} flex items-end p-2`}
          >
            <span className="text-3xl font-display text-white/30 font-bold leading-none">
              {item.product.brand.charAt(0)}
            </span>
          </div>
        )}
      </Link>

      <div className="flex-1 min-w-0 flex flex-col justify-between">
        <div className="flex justify-between items-start gap-3">
          <div className="min-w-0">
            <Link
              to={`/products/${item.product.slug}`}
              onClick={onNavigate}
              className="block text-[15px] font-semibold text-[#1A1A1A] leading-snug hover:underline truncate"
            >
              {item.product.name}
            </Link>
            <p className="text-xs tracking-[0.1em] uppercase text-[#777] mt-1">
              {item.product.brand}
            </p>
            {(item.size || item.color) && (
              <p className="text-xs text-[#444] mt-1.5">
                {[item.size && `Size: ${item.size}`, item.color && `Color: ${item.color}`]
                  .filter(Boolean)
                  .join("  |  ")}
              </p>
            )}
          </div>

          <div className="text-right flex-none">
            <p className="text-[15px] font-semibold text-[#1A1A1A]">
              {formatPrice(item.line_total)}
            </p>
            {savings > 0 && (
              <>
                <p className="text-xs text-[#AAA] line-through mt-0.5">
                  {formatPrice(String(listPrice * item.quantity))}
                </p>
                <p className="text-xs text-[#2D8A4E] mt-0.5">
                  Save {formatPrice(String(savings))}
                </p>
              </>
            )}
          </div>
        </div>

        <div className="flex justify-between items-end gap-3 mt-4">
          <QuantityStepper
            quantity={item.quantity}
            disabled={isPending}
            onChange={(next) =>
              updateItem.mutate({ itemId: item.id, quantity: next })
            }
          />
          <button
            type="button"
            disabled={isPending}
            onClick={() => removeItem.mutate(item.id)}
            className="text-xs uppercase tracking-wider text-[#777] hover:text-[#D64045] transition-colors underline-offset-4 hover:underline disabled:opacity-40"
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}
