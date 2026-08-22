// src/components/chat/ChatProductStrip.tsx
import { Link } from "react-router";
import type { ChatProductCard } from "../../api/chat";
import { formatPrice, getGradient } from "../../lib/product";

function ProductMiniCard({ product }: { product: ChatProductCard }) {
  return (
    <Link
      to={`/products/${product.slug}`}
      className="flex-none w-[160px] flex flex-col bg-white rounded-xl shadow-sm overflow-hidden snap-start group"
    >
      <div className="h-[200px] w-full relative overflow-hidden">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div
            className={`w-full h-full bg-gradient-to-br ${getGradient(
              product.name
            )} flex items-end p-3`}
          >
            <span className="text-5xl font-['Playfair_Display'] text-white/30 font-bold leading-none">
              {product.brand.charAt(0)}
            </span>
          </div>
        )}
        <div className="absolute inset-0 bg-[#1A1A1A]/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <span className="text-[10px] tracking-[0.15em] text-white bg-[#1A1A1A]/80 px-3 py-1.5 rounded-full backdrop-blur-md">
            VIEW
          </span>
        </div>
      </div>
      <div className="p-3 flex flex-col justify-between flex-1">
        <div>
          <p className="text-[10px] tracking-[0.1em] uppercase text-[#777] mb-1 truncate">
            {product.brand}
          </p>
          <h5 className="text-sm font-semibold text-[#1A1A1A] leading-tight line-clamp-2">
            {product.name}
          </h5>
        </div>
        <div className="flex items-center gap-2 mt-2">
          {product.discount_price ? (
            <>
              <span className="text-sm font-semibold text-[#1A1A1A]">
                {formatPrice(product.discount_price)}
              </span>
              <span className="text-xs text-[#AAA] line-through">
                {formatPrice(product.price)}
              </span>
            </>
          ) : (
            <span className="text-sm text-[#555]">{formatPrice(product.price)}</span>
          )}
        </div>
      </div>
    </Link>
  );
}

export default function ChatProductStrip({
  products,
}: {
  products: ChatProductCard[];
}) {
  if (products.length === 0) return null;
  return (
    <div className="flex overflow-x-auto gap-3 pt-3 pb-1 snap-x">
      {products.map((product) => (
        <ProductMiniCard key={product.id} product={product} />
      ))}
    </div>
  );
}
