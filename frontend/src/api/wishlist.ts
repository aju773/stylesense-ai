import api from "./axios";

/** Where a save came from. Drives the wishlist page's two tabs. */
export type WishlistSource = "manual" | "ai";

/** Same compact product payload the cart and chat cards use. */
export interface WishlistProduct {
  id: number;
  name: string;
  slug: string;
  brand: string;
  price: string;
  discount_price: string | null;
  image_url: string | null;
}

export interface WishlistItem {
  id: number;
  product: WishlistProduct;
  source: WishlistSource;
  /** Not on the product card; the wishlist page dims sold-out saves. */
  in_stock: boolean;
  added_at: string;
}

export interface ToggleWishlistPayload {
  product_id: number;
  /** Only honoured when the toggle creates a row. */
  source?: WishlistSource;
}

/**
 * The server decides whether the click saved or unsaved, so the client never
 * has to know the current state to send the right request.
 */
export interface ToggleWishlistResponse {
  saved: boolean;
  product_id: number;
  item: WishlistItem | null;
}

export async function fetchWishlist(): Promise<WishlistItem[]> {
  const response = await api.get<WishlistItem[]>("/wishlist/");
  return response.data;
}

export async function toggleWishlist(
  payload: ToggleWishlistPayload
): Promise<ToggleWishlistResponse> {
  const response = await api.post<ToggleWishlistResponse>(
    "/wishlist/toggle/",
    payload
  );
  return response.data;
}

export async function removeWishlistItem(itemId: number): Promise<void> {
  await api.delete(`/wishlist/items/${itemId}/`);
}
