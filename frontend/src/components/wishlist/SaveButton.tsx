import { useLocation, useNavigate } from "react-router";
import type { WishlistProduct, WishlistSource } from "../../api/wishlist";
import { useAuth } from "../../context/AuthContext";
import { useIsSaved, useToggleWishlist } from "../../hooks/useWishlist";

function HeartIcon({ filled, size = 18 }: { filled: boolean; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l8.8 8.8 8.8-8.8a5.5 5.5 0 0 0 0-7.8z" />
    </svg>
  );
}

interface SaveButtonProps {
  product: WishlistProduct;
  /**
   * Where this save came from. `"ai"` only from chat recommendation cards — the
   * assistant never writes to the wishlist itself, so an AI pick is one the
   * user chose to keep.
   */
  source?: WishlistSource;
  /** `overlay` floats on a product image; `wide` is the full-width CTA. */
  variant?: "overlay" | "wide";
  className?: string;
}

/**
 * The heart. One control with two meanings, so it sends the product id and lets
 * the server report which one happened — the optimistic flip below is what
 * makes it feel instant, not what decides the outcome.
 */
export default function SaveButton({
  product,
  source = "manual",
  variant = "overlay",
  className = "",
}: SaveButtonProps) {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isSaved = useIsSaved(product.id);
  const toggle = useToggleWishlist();

  const handleClick = (event: React.MouseEvent) => {
    // Hearts sit on top of cards that are themselves links.
    event.preventDefault();
    event.stopPropagation();

    // Saves are authenticated-only, so an anonymous heart is a login prompt.
    // `from` brings them back to where they clicked.
    if (!isAuthenticated) {
      navigate("/login", { state: { from: location.pathname } });
      return;
    }

    toggle.mutate({
      product_id: product.id,
      source,
      optimisticProduct: product,
    });
  };

  const label = isSaved
    ? `Remove ${product.name} from wishlist`
    : `Save ${product.name} to wishlist`;

  if (variant === "wide") {
    return (
      <button
        type="button"
        onClick={handleClick}
        aria-pressed={isSaved}
        aria-label={label}
        className={`h-[52px] flex items-center justify-center gap-2 border text-xs font-semibold tracking-[0.15em] uppercase transition-colors ${
          isSaved
            ? "border-[#D64045] text-[#D64045] hover:bg-[#FFF5F5]"
            : "border-[#1A1A1A] text-[#1A1A1A] hover:bg-[#F9F7F4]"
        } ${className}`}
      >
        <HeartIcon filled={isSaved} />
        {isSaved ? "Saved to Wishlist" : "Add to Wishlist"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={isSaved}
      aria-label={label}
      className={`w-8 h-8 rounded-full bg-white/80 backdrop-blur flex items-center justify-center transition-all hover:scale-110 ${
        isSaved ? "text-[#D64045]" : "text-[#1A1A1A]"
      } ${className}`}
    >
      <HeartIcon filled={isSaved} />
    </button>
  );
}
