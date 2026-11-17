import api from "./axios";

export type WishlistSource = "manual" | "ai";

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
  in_stock: boolean;
  added_at: string;
}

export interface ToggleWishlistPayload {
  product_id: number;
  source?: WishlistSource;
}

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
