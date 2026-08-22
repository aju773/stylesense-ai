import { AxiosError } from "axios";
import api from "./axios";

export type OrderStatus = "processing" | "shipped" | "delivered" | "cancelled";

/**
 * A purchased line, priced as it was priced when it was bought.
 *
 * Every field here is the order's own snapshot, not live catalog data — a
 * markdown applied tomorrow must not rewrite what was paid today. `product_id`
 * is the one live link and goes null if the product is ever deleted, so the UI
 * has to treat it as optional and fall back to the snapshotted name.
 */
export interface OrderItem {
  id: number;
  product_id: number | null;
  product_name: string;
  product_brand: string;
  product_slug: string;
  image_url: string;
  size: string;
  color: string;
  quantity: number;
  /** Price before the markdown, so an order can show what was saved. */
  list_price: string;
  /** Price actually charged per unit. */
  unit_price: string;
  line_total: string;
}

export interface Order {
  id: number;
  order_number: string;
  status: OrderStatus;
  status_label: string;
  subtotal: string;
  discount: string;
  shipping: string;
  total: string;
  item_count: number;
  items: OrderItem[];
  placed_at: string;
}

/** One line the server refused to fulfil, from a 409. */
export interface StockConflictLine {
  item_id: number;
  product_id: number;
  product_name: string;
  size: string;
  color: string;
  requested: number;
  available: number;
  reason: "insufficient_stock" | "unavailable";
}

/**
 * Hand this to the mock gateway to force a decline. There is no real payment
 * processor — see backend `apps/orders/services/payment_service.py`.
 */
export const DECLINE_TOKEN = "tok_decline";

/**
 * Everything checkout sends. No amounts, no line ids, no cart contents: the
 * server reads the caller's own bag and re-totals it from live prices, so
 * there is nothing here for a client to lie about.
 */
export interface PlaceOrderPayload {
  payment_token?: string;
}

export async function placeOrder(payload: PlaceOrderPayload = {}): Promise<Order> {
  const response = await api.post<Order>("/orders/", payload);
  return response.data;
}

export async function fetchOrders(): Promise<Order[]> {
  const response = await api.get<Order[]>("/orders/");
  return response.data;
}

export async function fetchOrder(orderId: number): Promise<Order> {
  const response = await api.get<Order>(`/orders/${orderId}/`);
  return response.data;
}

/**
 * The ways placement can fail, as a shape the checkout page can switch on.
 *
 * The three failures are genuinely different events and the UI treats them
 * differently: a decline is retryable on the spot, a stock conflict needs the
 * customer to go fix their bag, and an empty bag means they should not be here.
 */
export type PlaceOrderFailure =
  | { kind: "declined"; message: string; code: string }
  | { kind: "stock"; message: string; lines: StockConflictLine[] }
  | { kind: "empty"; message: string }
  | { kind: "unknown"; message: string };

const GENERIC_FAILURE = "Something went wrong placing your order. Nothing was charged.";

export function parsePlaceOrderError(error: unknown): PlaceOrderFailure {
  const response = (error as AxiosError<Record<string, unknown>>)?.response;
  const data = response?.data;
  const detail = typeof data?.detail === "string" ? data.detail : GENERIC_FAILURE;

  switch (response?.status) {
    case 402:
      return {
        kind: "declined",
        message: detail,
        code: typeof data?.code === "string" ? data.code : "declined",
      };
    case 409:
      return {
        kind: "stock",
        message: detail,
        lines: Array.isArray(data?.lines) ? (data.lines as StockConflictLine[]) : [],
      };
    case 400:
      return { kind: "empty", message: detail };
    default:
      return { kind: "unknown", message: detail };
  }
}
