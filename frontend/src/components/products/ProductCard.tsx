import { Link } from "react-router";
import type { Product } from "../../api/products";
import { formatPrice, getGradient } from "../../lib/product";
export default function ProductCard({ product }: { product: Product }) {
  const gradient = getGradient(product.name);
  return (
    <Link
      to={`/products/${product.slug}`}
      className="group block"
    >
      {/* Image fallback area */}
      <div
        className={`aspect-[3/4] bg-gradient-to-br ${gradient} rounded-lg mb-3 flex items-end p-4 overflow-hidden relative`}
      >
        <span className="text-6xl font-['Playfair_Display'] text-white/30 font-bold leading-none">
          {product.brand.charAt(0)}
        </span>
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-200" />
      </div>
      {/* Info */}
      <div className="space-y-1">
        <p className="text-xs tracking-[0.1em] uppercase text-[#777]">
          {product.brand}
        </p>
        <h3 className="text-sm font-medium text-[#1A1A1A] group-hover:underline transition-colors duration-150">
          {product.name}
        </h3>
        <div className="flex items-center gap-2">
          {product.discount_price ? (
            <>
              <span className="text-sm font-semibold text-[#1A1A1A]">
                {formatPrice(product.discount_price)}
              </span>
              <span className="text-sm text-[#AAA] line-through">
                {formatPrice(product.price)}
              </span>
            </>
          ) : (
            <span className="text-sm font-semibold text-[#1A1A1A]">
              {formatPrice(product.price)}
            </span>
          )}
        </div>
        {Number(product.rating) > 0 && (
          <p className="text-xs text-[#777]">★ {product.rating}</p>
        )}
      </div>
    </Link>
  );
}
