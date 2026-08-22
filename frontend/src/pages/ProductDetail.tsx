import { useState } from "react";
import { useParams, Link, useLocation, useNavigate } from "react-router";
import { useProduct } from "../hooks/useProduct";
import { useAuth } from "../context/AuthContext";
import { useCartUI } from "../context/CartUIContext";
import { useAddToCart } from "../hooks/useCart";
import ImageGallery from "../components/products/ImageGallery";

function formatPrice(price: string) {
  return `₹${Number(price).toLocaleString("en-IN")}`;
}

export default function ProductDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { data: product, isLoading, isError } = useProduct(slug!);
  const { isAuthenticated } = useAuth();
  const { openDrawer } = useCartUI();
  const addToCart = useAddToCart();
  const navigate = useNavigate();
  const location = useLocation();

  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [addError, setAddError] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-[#777] text-sm tracking-[0.1em] uppercase">Loading…</p>
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-[#D64045] text-sm">Product not found.</p>
      </div>
    );
  }

  // Arrow const, not a declaration: only this form lets TypeScript keep the
  // `product` narrowing from the guards above, so no non-null assertions.
  const handleAddToBag = () => {
    // Carts are authenticated-only, so an anonymous add is a login prompt.
    // `from` brings them back to this page after they sign in.
    if (!isAuthenticated) {
      navigate("/login", { state: { from: location.pathname } });
      return;
    }
    if (product.sizes.length > 0 && !selectedSize) {
      setAddError("Please select a size.");
      return;
    }
    if (product.colors.length > 0 && !selectedColor) {
      setAddError("Please select a color.");
      return;
    }
    setAddError(null);
    addToCart.mutate(
      {
        product_id: product.id,
        size: selectedSize ?? "",
        color: selectedColor ?? "",
        quantity: 1,
        // Lets the drawer show the line before the round-trip finishes.
        optimisticProduct: {
          id: product.id,
          name: product.name,
          slug: product.slug,
          brand: product.brand,
          price: product.price,
          discount_price: product.discount_price,
          image_url: product.images?.[0]?.image_url ?? null,
        },
      },
      {
        onSuccess: () => openDrawer(),
        onError: (error) => {
          const detail = (
            error as { response?: { data?: { detail?: string } } }
          ).response?.data?.detail;
          setAddError(detail ?? "Couldn't add to bag. Please try again.");
        },
      }
    );
  };

  const hasDiscount = product.discount_price != null;
  const discountPercent = hasDiscount
    ? Math.round((1 - Number(product.discount_price) / Number(product.price)) * 100)
    : 0;

  return (
    <div className="max-w-[1280px] mx-auto px-4 py-12">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1.5 text-xs text-[#777] mb-8">
        <Link to="/" className="hover:text-[#1A1A1A] transition-colors">Home</Link>
        <span>›</span>
        <Link to="/shop" className="hover:text-[#1A1A1A] transition-colors">Shop</Link>
        <span>›</span>
        <Link
          to={`/shop?category=${product.category.slug}`}
          className="hover:text-[#1A1A1A] transition-colors"
        >
          {product.category.name}
        </Link>
        <span>›</span>
        <span className="text-[#1A1A1A] font-semibold">{product.name}</span>
      </nav>

      <div className="flex flex-col lg:flex-row gap-8 lg:gap-16">
        {/* Left — Image Gallery (55%) */}
        <div className="w-full lg:w-[55%]">
          <ImageGallery
            images={product.images ?? []}
            productName={product.name}
            brandInitial={product.brand.charAt(0)}
          />
        </div>

        {/* Right — Product Info (45%), sticky on desktop */}
        <div className="w-full lg:w-[45%]">
          <div className="lg:sticky lg:top-24 flex flex-col gap-5">
            {/* Brand */}
            <span className="text-xs font-semibold tracking-[0.2em] uppercase text-[#777]">
              {product.brand}
            </span>

            {/* Name */}
            <h1 className="font-['Playfair_Display'] text-3xl lg:text-4xl text-[#1A1A1A]">
              {product.name}
            </h1>

            {/* Rating */}
            {Number(product.rating) > 0 && (
              <p className="text-sm text-[#777]">★ {product.rating} / 5</p>
            )}

            {/* Price */}
            <div className="flex items-end gap-3">
              <span className="text-2xl font-semibold text-[#1A1A1A]">
                {formatPrice(product.discount_price ?? product.price)}
              </span>
              {hasDiscount && (
                <>
                  <span className="text-base text-[#AAA] line-through pb-[2px]">
                    {formatPrice(product.price)}
                  </span>
                  <span className="bg-[#D64045] text-white text-[10px] font-semibold tracking-wider px-1.5 py-0.5 mb-[3px]">
                    {discountPercent}% OFF
                  </span>
                </>
              )}
            </div>

            <div className="w-full h-px bg-[#E5E5E5]" />

            {/* Color selector */}
            {product.colors.length > 0 && (
              <div>
                <span className="block text-xs font-semibold tracking-[0.1em] uppercase text-[#1A1A1A] mb-3">
                  Color{selectedColor && ` — ${selectedColor}`}
                </span>
                <div className="flex gap-3">
                  {product.colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      aria-label={color}
                      aria-selected={selectedColor === color}
                      title={color}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${
                        selectedColor === color
                          ? "ring-2 ring-[#1A1A1A] ring-offset-2 border-[#1A1A1A]"
                          : "border-[#E5E5E5] hover:border-[#AAA]"
                      }`}
                      style={{ backgroundColor: color.toLowerCase() }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Size selector */}
            {product.sizes.length > 0 && (
              <div>
                <span className="block text-xs font-semibold tracking-[0.1em] uppercase text-[#1A1A1A] mb-3">
                  Size
                </span>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      aria-selected={selectedSize === size}
                      className={`min-w-[48px] px-4 py-2 text-sm border transition-colors ${
                        selectedSize === size
                          ? "bg-[#1A1A1A] text-white border-[#1A1A1A]"
                          : "border-[#E5E5E5] text-[#333] hover:border-[#1A1A1A] hover:text-[#1A1A1A]"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Stock */}
            <p className={`text-sm ${product.stock > 0 ? "text-[#2D8A4E]" : "text-[#D64045]"}`}>
              {product.stock > 0 ? `✓ In Stock (${product.stock})` : "Out of Stock"}
            </p>

            {/* Action buttons */}
            <div className="flex flex-col gap-3 mt-2">
              <button
                type="button"
                onClick={handleAddToBag}
                disabled={product.stock === 0 || addToCart.isPending}
                className="h-[52px] bg-[#1A1A1A] text-white text-xs font-semibold tracking-[0.15em] uppercase hover:bg-[#333] transition-colors disabled:opacity-40 disabled:hover:bg-[#1A1A1A]"
              >
                {addToCart.isPending ? "Adding…" : "Add to Bag"}
              </button>
              {addError && (
                <p role="alert" className="text-xs text-[#D64045] -mt-1">
                  {addError}
                </p>
              )}
              <button className="h-[52px] border border-[#1A1A1A] text-[#1A1A1A] text-xs font-semibold tracking-[0.15em] uppercase hover:bg-[#F9F7F4] transition-colors">
                ♡ Add to Wishlist
              </button>
            </div>

            <div className="w-full h-px bg-[#E5E5E5]" />

            {/* Description */}
            <div>
              <h3 className="text-xs font-semibold tracking-[0.1em] uppercase text-[#1A1A1A] mb-2">
                Description
              </h3>
              <p className="text-sm text-[#333] leading-relaxed">
                {product.description}
              </p>
            </div>

            {/* Meta */}
            <div className="flex gap-6 text-sm text-[#777] border-t border-[#E5E5E5] pt-4">
              <span>{product.gender}</span>
              <span>{product.category.name}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
