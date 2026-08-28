// Shared presentation helpers for product cards (catalog grid + AI chat strip).

export function formatPrice(price: string) {
  return `₹${Number(price).toLocaleString("en-IN")}`;
}

const GALLERY_VIEW_CROPS = ["", "top", "bottom"] as const;

export interface GalleryView {
  key: string;
  url: string;
}

/**
 * One curated photo per product (11.3) — three different stock photos of
 * "linen trousers" are three different garments, so extra gallery views are
 * derived as imgix crops of that single photo rather than sourced separately.
 * Every seeded url is a `images.unsplash.com` imgix URL; `crop=` composes
 * with the `fit=crop` the seed already appends.
 */
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
