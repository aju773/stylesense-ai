import api from "./axios";

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
  unit_price: string;
  line_total: string;
  added_at: string;
}

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
