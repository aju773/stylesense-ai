import api from "./axios";

/** Compact product payload the server nests in each cart line. */
export interface CartProduct {
  id: number;
  name: string;
  slug: string;
  brand: string;
  price: string;
  discount_price: string | null;
  image_url: string | null;
}

export interface CartItem {
  id: number;
  product: CartProduct;
  size: string;
  color: string;
  quantity: number;
  /** Price charged per unit — already the markdown where one applies. */
  unit_price: string;
  line_total: string;
  added_at: string;
}

/**
 * All money comes from the server. Nothing in the frontend recomputes these —
 * optimistic updates included, which estimate them and then get corrected by
 * the response.
 */
export interface CartTotals {
  subtotal: string;
  discount: string;
  shipping: string;
  total: string;
  item_count: number;
  line_count: number;
}

export interface Cart {
  items: CartItem[];
  totals: CartTotals;
}

export interface AddCartItemPayload {
  product_id: number;
  size?: string;
  color?: string;
  quantity?: number;
}

/** Mutating endpoints answer with the whole recomputed bag. */
interface CartMutationResponse {
  item: CartItem;
  cart: Cart;
}

export async function fetchCart(): Promise<Cart> {
  const response = await api.get<Cart>("/cart/");
  return response.data;
}

export async function addCartItem(payload: AddCartItemPayload): Promise<Cart> {
  const response = await api.post<CartMutationResponse>("/cart/items/", payload);
  return response.data.cart;
}

export async function updateCartItem(
  itemId: number,
  quantity: number
): Promise<Cart> {
  const response = await api.patch<CartMutationResponse>(
    `/cart/items/${itemId}/`,
    { quantity }
  );
  return response.data.cart;
}

export async function removeCartItem(itemId: number): Promise<Cart> {
  const response = await api.delete<Cart>(`/cart/items/${itemId}/`);
  return response.data;
}

export async function clearCart(): Promise<Cart> {
  const response = await api.delete<Cart>("/cart/");
  return response.data;
}
