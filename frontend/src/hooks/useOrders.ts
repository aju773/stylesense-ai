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

export function usePlaceOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: PlaceOrderPayload = {}) => placeOrder(payload),

    onSuccess: (order) => {
      queryClient.setQueryData(CART_QUERY_KEY, EMPTY_CART);
      queryClient.invalidateQueries({ queryKey: CART_QUERY_KEY });
      queryClient.setQueryData([...ORDERS_QUERY_KEY, order.id], order);
      queryClient.invalidateQueries({ queryKey: ORDERS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["product"] });
    },

    onError: () => {
      queryClient.invalidateQueries({ queryKey: CART_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["product"] });
    },
  });
}
