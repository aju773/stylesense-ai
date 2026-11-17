import { useState, type CSSProperties } from "react";

interface ProductPhotoProps {
  src?: string | null;
  alt: string;
  className?: string;
  style?: CSSProperties;
}

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
