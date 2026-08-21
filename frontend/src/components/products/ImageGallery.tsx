import { useState, useRef } from "react";
import type { ProductImage } from "../../api/products";
interface ImageGalleryProps {
  images: ProductImage[];
  productName: string;
  brandInitial: string;
}
// Fallback gradients for products without images
const gradients = [
  "from-[#E8E0D8] to-[#D4C5B5]",
  "from-[#D8DDE8] to-[#B5BFD4]",
  "from-[#E8D8DE] to-[#D4B5C0]",
  "from-[#D8E8E0] to-[#B5D4C5]",
  "from-[#E0D8E8] to-[#C5B5D4]",
  "from-[#E8E4D8] to-[#D4CDB5]",
];
function getGradient(name: string) {
  let hash = 0;
  for (const ch of name) hash = (hash + ch.charCodeAt(0)) % gradients.length;
  return gradients[hash];
}
export default function ImageGallery({
  images,
  productName,
  brandInitial,
}: ImageGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [zoom, setZoom] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const imgRef = useRef<HTMLDivElement>(null);
  const hasImages = images.length > 0;
  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!imgRef.current) return;
    const rect = imgRef.current.getBoundingClientRect();
    // Convert mouse position to percentage within the image
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPos({ x, y });
  }
  const gradient = getGradient(productName);
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
        {hasImages ? (
          <img
            src={images[activeIndex].image_url}
            alt={`${productName} — view ${activeIndex + 1}`}
            className="w-full h-full object-cover transition-transform duration-300"
            style={
              zoom
                ? {
                    transform: "scale(2)",
                    transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
                  }
                : undefined
            }
          />
        ) : (
          <div
            className={`w-full h-full bg-gradient-to-br ${gradient} flex items-end p-8`}
          >
            <span className="text-8xl font-['Playfair_Display'] text-white/30 font-bold leading-none">
              {brandInitial}
            </span>
          </div>
        )}
      </div>
      {/* Thumbnails — only show if multiple images */}
      {hasImages && images.length > 1 && (
        <div className="grid grid-cols-4 gap-3">
          {images.map((img, i) => (
            <button
              key={img.id}
              onClick={() => setActiveIndex(i)}
              className={`aspect-[4/5] overflow-hidden transition-opacity ${
                i === activeIndex
                  ? "border-2 border-[#1A1A1A] opacity-100"
                  : "border border-[#E5E5E5] opacity-60 hover:opacity-100"
              }`}
            >
              <img
                src={img.image_url}
                alt={`${productName} — thumbnail ${i + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
