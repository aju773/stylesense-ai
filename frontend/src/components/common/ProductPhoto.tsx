import { useState, type CSSProperties } from "react";

interface ProductPhotoProps {
  src?: string | null;
  alt: string;
  /** Sizing/positioning only — e.g. "w-full h-full". Fallback and `<img>` both get it. */
  className?: string;
  style?: CSSProperties;
}

/**
 * Every image-bearing surface renders through this. Two things fall back to
 * the same quiet placeholder instead of six different loud gradients: no url
 * at all (an order-item snapshot defaults to `""`, or the catalog genuinely
 * has nothing), and a url that 404s — the likely failure mode on an
 * architecture that hotlinks someone else's CDN forever.
 */
export default function ProductPhoto({ src, alt, className = "", style }: ProductPhotoProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className={`bg-[#F5F5F5] flex items-center justify-center ${className}`}>
        <span className="font-display text-xs tracking-[0.15em] uppercase text-[#AAA]">
          StyleSense
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      style={style}
      className={`object-cover ${className}`}
    />
  );
}
