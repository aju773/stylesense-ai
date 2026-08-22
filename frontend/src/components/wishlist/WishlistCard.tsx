import { Link } from "react-router";
import type { WishlistItem } from "../../api/wishlist";
import { formatPrice, getGradient } from "../../lib/product";
import { useRemoveWishlistItem } from "../../hooks/useWishlist";

function HeartIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="currentColor"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l8.8 8.8 8.8-8.8a5.5 5.5 0 0 0 0-7.8z" />
    </svg>
  );
}

function formatAddedOn(isoDate: string) {
  return new Date(isoDate).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function WishlistCard({ item }: { item: WishlistItem }) {
  const removeItem = useRemoveWishlistItem();
  const { product, in_stock: inStock } = item;

  // A placeholder from an optimistic save has no server row to DELETE yet.
  const isPlaceholder = item.id < 0;
  const price = product.discount_price ?? product.price;

  return (
    <div className="group relative flex flex-col gap-3">
      <div
        className={`relative aspect-[3/4] w-full overflow-hidden rounded-lg bg-[#EBE7E6] ${
          inStock ? "" : "opacity-60"
        }`}
      >
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            loading="lazy"
            className={`w-full h-full object-cover transition-transform duration-700 ${
              inStock ? "group-hover:scale-105" : "grayscale-[30%]"
            }`}
          />
        ) : (
          <div
            className={`w-full h-full bg-gradient-to-br ${getGradient(
              product.name
            )} flex items-end p-4`}
          >
            <span className="text-6xl font-['Playfair_Display'] text-white/30 font-bold leading-none">
              {product.brand.charAt(0)}
            </span>
          </div>
        )}

        {/* The heart on this page only ever removes, so it is a delete by row
            id — not the toggle. Through a toggle, an impatient double-click
            here would remove the product and then save it straight back. */}
        <button
          type="button"
          onClick={() => removeItem.mutate(item.id)}
          disabled={isPlaceholder || removeItem.isPending}
          aria-label={`Remove ${product.name} from wishlist`}
          className="absolute top-2 right-2 z-10 w-8 h-8 rounded-full bg-white/80 backdrop-blur shadow-sm flex items-center justify-center text-[#D64045] transition-transform hover:scale-110 disabled:opacity-50 disabled:hover:scale-100"
        >
          <HeartIcon />
        </button>

        {!inStock && (
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-center z-10">
            <span className="bg-[#E5E2E1]/90 backdrop-blur px-4 py-2 text-[10px] font-semibold tracking-[0.15em] uppercase text-[#1A1A1A]">
              Out of Stock
            </span>
          </div>
        )}

        {/* Every product in the catalog is sold in sizes and colors, so this
            cannot add to the bag directly — it would have to invent a variant.
            It goes to the product page, where the real picker already is. */}
        {inStock && (
          <Link
            to={`/products/${product.slug}`}
            // Hidden-then-revealed only where hovering is possible. Tailwind
            // compiles `group-hover:` inside `@media (hover: hover)`, so on a
            // touch device the reveal never fires — hiding it there by default
            // would leave the card's primary control permanently unreachable.
            // Keyed on the capability rather than a width, because a touch
            // tablet is wide and still cannot hover.
            className="absolute inset-x-0 bottom-0 p-3 transition-all duration-300 ease-out z-10 [@media(hover:hover)]:translate-y-full [@media(hover:hover)]:opacity-0 group-hover:translate-y-0 group-hover:opacity-100 focus-within:translate-y-0 focus-within:opacity-100"
          >
            <span className="block w-full py-3 bg-[#1A1A1A]/90 backdrop-blur text-white text-center text-[10px] font-semibold tracking-[0.15em] uppercase hover:bg-[#1A1A1A] transition-colors">
              Move to Bag
            </span>
          </Link>
        )}
      </div>

      <div className={`flex flex-col gap-1 ${inStock ? "" : "opacity-60"}`}>
        <div className="flex items-center gap-2">
          <span className="text-[10px] tracking-[0.15em] uppercase text-[#777] truncate">
            {product.brand}
          </span>
          {/* The tabs separate these, but in All Saved this label is the only
              thing that says where a save came from. */}
          {item.source === "ai" && (
            <span className="text-[10px] tracking-[0.1em] uppercase text-[#6366F1] whitespace-nowrap">
              ✦ AI Pick
            </span>
          )}
        </div>

        <Link
          to={`/products/${product.slug}`}
          className="text-sm text-[#1A1A1A] truncate hover:underline"
        >
          {product.name}
        </Link>

        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-[#1A1A1A]">
            {formatPrice(price)}
          </span>
          {product.discount_price && (
            <span className="text-xs text-[#AAA] line-through">
              {formatPrice(product.price)}
            </span>
          )}
        </div>

        <span className="text-[11px] text-[#AAA] mt-1">
          Added on: {formatAddedOn(item.added_at)}
        </span>
      </div>
    </div>
  );
}
