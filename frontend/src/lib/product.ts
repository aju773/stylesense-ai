
export function formatPrice(price: string) {
  return `₹${Number(price).toLocaleString("en-IN")}`;
}

const GALLERY_VIEW_CROPS = ["", "top", "bottom"] as const;

export interface GalleryView {
  key: string;
  url: string;
}

export function deriveGalleryViews(
  images: { id: number; image_url: string }[]
): GalleryView[] {
  if (images.length !== 1) {
    return images.map((img) => ({ key: String(img.id), url: img.image_url }));
  }
  const [{ id, image_url }] = images;
  return GALLERY_VIEW_CROPS.map((crop) => ({
    key: `${id}-${crop || "default"}`,
    url: crop ? `${image_url}&crop=${crop}` : image_url,
  }));
}
