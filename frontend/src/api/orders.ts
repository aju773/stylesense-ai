import { AxiosError } from "axios";
import api from "./axios";

export type OrderStatus = "processing" | "shipped" | "delivered" | "cancelled";

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
  list_price: string;
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

export const DECLINE_TOKEN = "tok_decline";

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
