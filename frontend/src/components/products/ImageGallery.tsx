import { useState, useRef } from "react";
import type { ProductImage } from "../../api/products";
import { deriveGalleryViews } from "../../lib/product";
import ProductPhoto from "../common/ProductPhoto";

interface ImageGalleryProps {
  images: ProductImage[];
  productName: string;
}

export default function ImageGallery({ images, productName }: ImageGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [zoom, setZoom] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const imgRef = useRef<HTMLDivElement>(null);
  const views = deriveGalleryViews(images);
  const hasImages = views.length > 0;

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!imgRef.current) return;
    const rect = imgRef.current.getBoundingClientRect();
    // Convert mouse position to percentage within the image
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPos({ x, y });
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Main image */}
      <div
        ref={imgRef}
        className="aspect-[4/5] bg-[#F5F5F5] relative overflow-hidden cursor-crosshair"
        onMouseEnter={() => hasImages && setZoom(true)}
        onMouseLeave={() => setZoom(false)}
        onMouseMove={handleMouseMove}
      >
        <ProductPhoto
          src={views[activeIndex]?.url}
          alt={`${productName} — view ${activeIndex + 1}`}
          className="w-full h-full transition-transform duration-300"
          style={
            zoom
              ? {
                  transform: "scale(2)",
                  transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
                }
              : undefined
          }
        />
      </div>
      {/* Thumbnails — only show if multiple views */}
      {views.length > 1 && (
        <div className="grid grid-cols-4 gap-3">
          {views.map((view, i) => (
            <button
              key={view.key}
              onClick={() => setActiveIndex(i)}
              className={`aspect-[4/5] overflow-hidden transition-opacity ${
                i === activeIndex
                  ? "border-2 border-[#1A1A1A] opacity-100"
                  : "border border-[#E5E5E5] opacity-60 hover:opacity-100"
              }`}
            >
              <ProductPhoto
                src={view.url}
                alt={`${productName} — thumbnail ${i + 1}`}
                className="w-full h-full"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
