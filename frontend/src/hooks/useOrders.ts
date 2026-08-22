import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchOrder,
  fetchOrders,
  placeOrder,
  type Order,
  type PlaceOrderPayload,
} from "../api/orders";
import { useAuth } from "../context/AuthContext";
import { CART_QUERY_KEY, EMPTY_CART } from "./useCart";

export const ORDERS_QUERY_KEY = ["orders"] as const;

export function useOrders() {
  const { isAuthenticated } = useAuth();

  return useQuery<Order[]>({
    queryKey: ORDERS_QUERY_KEY,
    queryFn: fetchOrders,
    enabled: isAuthenticated,
  });
}

export function useOrder(orderId: number | undefined) {
  const { isAuthenticated } = useAuth();

  return useQuery<Order>({
    queryKey: [...ORDERS_QUERY_KEY, orderId],
    queryFn: () => fetchOrder(orderId!),
    enabled: isAuthenticated && orderId !== undefined,
  });
}

/**
 * Placing an order is the one mutation here with no optimistic update.
 *
 * Every cart mutation can be applied locally and rolled back, because the
 * client can predict the outcome. This one cannot: whether it succeeds depends
 * on stock the client hasn't seen and a payment that hasn't happened. Showing a
 * confirmed order before the server confirms it would be showing a purchase
 * that might not exist.
 */
export function usePlaceOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: PlaceOrderPayload = {}) => placeOrder(payload),

    onSuccess: (order) => {
      // The server emptied the bag inside the placement transaction. Write that
      // through immediately so the header badge drops in the same frame the
      // confirmation appears, then refetch to be sure.
      queryClient.setQueryData(CART_QUERY_KEY, EMPTY_CART);
      queryClient.invalidateQueries({ queryKey: CART_QUERY_KEY });
      queryClient.setQueryData([...ORDERS_QUERY_KEY, order.id], order);
      queryClient.invalidateQueries({ queryKey: ORDERS_QUERY_KEY });
      // Stock just moved for everything in the order.
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["product"] });
    },

    onError: () => {
      // A 409 means the catalog moved underneath the bag. Refetch both so the
      // customer is looking at what is actually available before they retry.
      queryClient.invalidateQueries({ queryKey: CART_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["product"] });
    },
  });
}
