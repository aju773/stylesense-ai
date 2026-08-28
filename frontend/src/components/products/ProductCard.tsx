import { useState } from "react";
import { Link } from "react-router";
import type { WishlistSource } from "../../api/wishlist";
import { formatPrice } from "../../lib/product";
import { useAddToCart } from "../../hooks/useCart";
import ProductPhoto from "../common/ProductPhoto";
import SaveButton from "../wishlist/SaveButton";

/** Shared subset both the catalog `Product` and chat `ChatProductCard` satisfy. */
export interface CardProduct {
  id: number;
  name: string;
  slug: string;
  brand: string;
  price: string;
  discount_price: string | null;
  image_url: string | null;
  stock: number;
  sizes: string[];
  colors: string[];
  /** Catalog only — chat cards have no rating, so this stays optional. */
  rating?: string;
}

interface ProductCardProps {
  product: CardProduct;
  /** The AI's rationale for this pick. Omitted entirely when absent — the
   * catalog grid never passes one. */
  reason?: string | null;
  /** Chat picks can add straight to the bag; the catalog card links to the
   * product page for that instead, so this defaults off. */
  showAddToBag?: boolean;
  /** `"row"` is the editorial mobile layout used only inside the chat picks
   * block below its grid breakpoint. Catalog usage never sets this. */
  layout?: "grid" | "row";
  /** `"ai"` only for chat recommendation cards — see SaveButton. */
  saveSource?: WishlistSource;
}

function Price({ product }: { product: CardProduct }) {
  return product.discount_price ? (
    <span className="flex items-baseline gap-2">
      <span className="text-sm font-semibold text-[#1A1A1A]">
        {formatPrice(product.discount_price)}
      </span>
      <span className="text-xs text-[#AAA] line-through">{formatPrice(product.price)}</span>
    </span>
  ) : (
    <span className="text-sm font-semibold text-[#1A1A1A]">{formatPrice(product.price)}</span>
  );
}

function Reason({ text, clamp }: { text: string; clamp?: boolean }) {
  return (
    <p className={`text-xs leading-relaxed text-[#777] ${clamp ? "line-clamp-2" : ""}`}>
      <span className="mr-1 text-[#6366F1]">✦</span>
      {text}
    </p>
  );
}

function OutOfStockBadge() {
  return (
    <div className="absolute inset-x-0 top-1/2 z-10 flex -translate-y-1/2 justify-center">
      <span className="bg-[#E5E2E1]/90 backdrop-blur px-4 py-2 text-[10px] font-semibold tracking-[0.15em] uppercase text-[#1A1A1A]">
        Out of Stock
      </span>
    </div>
  );
}

/**
 * The add-to-bag action slot. Every catalog product has both sizes and
 * colors, and `cart_service._validate_variant` rejects an add missing either
 * whenever the product is sold in more than one — so a single click can never
 * just work here. It expands into an inline picker instead of a popover
 * (nothing to portal past the epic's `backdrop-filter` containing-block
 * problem) or a route to the product page (the point is acting without
 * leaving the conversation).
 */
function AddToBag({ product }: { product: CardProduct }) {
  const [open, setOpen] = useState(false);
  const [size, setSize] = useState<string | null>(null);
  const [color, setColor] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const addToCart = useAddToCart();

  const needsSize = product.sizes.length > 1;
  const needsColor = product.colors.length > 1;

  // Stock can reach zero between the reply arriving and this click — history
  // also replays old picks that ChatMessage.products has no idea went out of
  // stock — so this is checked here, independent of retrieval-time filtering.
  if (product.stock === 0) {
    return (
      <span className="inline-flex w-full items-center justify-center border border-[#E5E5E5] px-4 py-2 text-[11px] uppercase tracking-[0.12em] text-[#AAA]">
        Out of stock
      </span>
    );
  }

  if (done) {
    return (
      <span className="inline-flex w-full items-center justify-center gap-1.5 border border-[#2D8A4E] px-4 py-2 text-[11px] uppercase tracking-[0.12em] text-[#2D8A4E]">
        ✓ In your bag
      </span>
    );
  }

  function handleAdd() {
    addToCart.mutate(
      {
        product_id: product.id,
        size: size ?? product.sizes[0] ?? "",
        color: color ?? product.colors[0] ?? "",
        quantity: 1,
        optimisticProduct: product,
      },
      { onSuccess: () => setDone(true) }
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        disabled={addToCart.isPending}
        onClick={() => (needsSize || needsColor ? setOpen(true) : handleAdd())}
        className="w-full bg-[#1A1A1A] px-4 py-2 text-[11px] uppercase tracking-[0.12em] text-white transition-opacity hover:opacity-85 disabled:opacity-50"
      >
        {addToCart.isPending ? "Adding…" : "Add to Bag"}
      </button>
    );
  }

  const ready = (!needsSize || size) && (!needsColor || color);

  return (
    <div className="border border-[#E5E5E5] bg-[#F9F7F4] p-2.5">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-[0.12em] text-[#777]">
          {needsSize && needsColor ? "Size & colour" : needsSize ? "Size" : "Colour"}
        </span>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs text-[#AAA] hover:text-[#1A1A1A]"
        >
          ✕
        </button>
      </div>
      {needsSize && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {product.sizes.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSize(s)}
              aria-pressed={size === s}
              className={`min-w-[34px] border px-2 py-1 text-[11px] transition-colors ${
                size === s
                  ? "border-[#1A1A1A] bg-[#1A1A1A] text-white"
                  : "border-[#E5E5E5] bg-white text-[#333] hover:border-[#1A1A1A]"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      )}
      {needsColor && (
        <div className="mb-2 flex flex-wrap gap-2">
          {product.colors.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              aria-label={c}
              aria-pressed={color === c}
              title={c}
              className={`h-6 w-6 rounded-full border-2 transition-all ${
                color === c
                  ? "ring-2 ring-[#1A1A1A] ring-offset-1 border-[#1A1A1A]"
                  : "border-[#E5E5E5] hover:border-[#AAA]"
              }`}
              style={{ backgroundColor: c.toLowerCase() }}
            />
          ))}
        </div>
      )}
      <button
        type="button"
        disabled={!ready || addToCart.isPending}
        onClick={handleAdd}
        className="w-full bg-[#1A1A1A] px-3 py-1.5 text-[11px] uppercase tracking-[0.12em] text-white disabled:opacity-30"
      >
        {addToCart.isPending ? "Adding…" : "Add"}
      </button>
    </div>
  );
}

function RowLayout({
  product,
  reason,
  showAddToBag,
  saveSource,
}: Required<Pick<ProductCardProps, "product">> &
  Pick<ProductCardProps, "reason" | "showAddToBag" | "saveSource">) {
  const outOfStock = product.stock === 0;
  return (
    <div className="flex gap-4 py-4 first:pt-0">
      <Link
        to={`/products/${product.slug}`}
        className="relative block w-[104px] shrink-0 overflow-hidden rounded-lg bg-[#F5F5F5]"
      >
        <div className="aspect-[4/5]">
          <ProductPhoto
            src={product.image_url}
            alt={product.name}
            className={`w-full h-full ${outOfStock ? "opacity-60 grayscale-[30%]" : ""}`}
          />
        </div>
        {outOfStock && <OutOfStockBadge />}
      </Link>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-[10px] uppercase tracking-[0.12em] text-[#777]">
              {product.brand}
            </p>
            <Link
              to={`/products/${product.slug}`}
              className="block truncate text-sm text-[#1A1A1A] hover:underline"
            >
              {product.name}
            </Link>
          </div>
          <SaveButton className="shrink-0" source={saveSource} product={product} />
        </div>
        {reason && <Reason text={reason} />}
        <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
          <Price product={product} />
          {showAddToBag && (
            <div className="w-[150px]">
              <AddToBag product={product} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function GridLayout({
  product,
  reason,
  showAddToBag,
  saveSource,
}: Required<Pick<ProductCardProps, "product">> &
  Pick<ProductCardProps, "reason" | "showAddToBag" | "saveSource">) {
  const outOfStock = product.stock === 0;
  return (
    // The heart is a sibling of the link, not a child: a <button> inside an
    // <a> is invalid HTML, and nesting it means every save click also has to
    // fight the anchor's navigation.
    <div className="group relative flex flex-col">
      <Link to={`/products/${product.slug}`} className="block">
        <div className="relative mb-3 aspect-[4/5] overflow-hidden rounded-lg">
          <ProductPhoto
            src={product.image_url}
            alt={product.name}
            className={`w-full h-full ${outOfStock ? "opacity-60 grayscale-[30%]" : ""}`}
          />
          <div className="absolute inset-0 bg-black/0 transition-colors duration-200 group-hover:bg-black/5" />
          {outOfStock && <OutOfStockBadge />}
        </div>
        <div className={`space-y-1 ${outOfStock ? "opacity-60" : ""}`}>
          <p className="text-xs tracking-[0.1em] uppercase text-[#777]">{product.brand}</p>
          <h3 className="text-sm font-medium text-[#1A1A1A] transition-colors duration-150 group-hover:underline">
            {product.name}
          </h3>
          <Price product={product} />
          {product.rating != null && Number(product.rating) > 0 && (
            <p className="text-xs text-[#777]">★ {product.rating}</p>
          )}
          {reason && <Reason text={reason} clamp />}
        </div>
      </Link>

      <SaveButton
        className="absolute top-2 right-2 z-10 shadow-sm"
        source={saveSource}
        product={product}
      />

      {showAddToBag && (
        <div className="mt-2">
          <AddToBag product={product} />
        </div>
      )}
    </div>
  );
}

export default function ProductCard({
  product,
  reason,
  showAddToBag = false,
  layout = "grid",
  saveSource,
}: ProductCardProps) {
  return layout === "row" ? (
    <RowLayout
      product={product}
      reason={reason}
      showAddToBag={showAddToBag}
      saveSource={saveSource}
    />
  ) : (
    <GridLayout
      product={product}
      reason={reason}
      showAddToBag={showAddToBag}
      saveSource={saveSource}
    />
  );
}
