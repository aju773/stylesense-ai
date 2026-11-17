import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { QueryClient } from "@tanstack/react-query";
import {
  addCartItem,
  clearCart,
  fetchCart,
  removeCartItem,
  updateCartItem,
  type AddCartItemPayload,
  type Cart,
  type CartItem,
  type CartProduct,
} from "../api/cart";
import { useAuth } from "../context/AuthContext";

export const CART_QUERY_KEY = ["cart"] as const;

export const EMPTY_CART: Cart = {
  items: [],
  totals: {
    subtotal: "0.00",
    discount: "0.00",
    shipping: "0.00",
    total: "0.00",
    item_count: 0,
    line_count: 0,
  },
};

function estimateTotals(items: CartItem[]): Cart["totals"] {
  let subtotal = 0;
  let discount = 0;
  let itemCount = 0;

  for (const item of items) {
    const listPrice = Number(item.product.price);
    const paidPrice = Number(item.unit_price);
    subtotal += listPrice * item.quantity;
    discount += (listPrice - paidPrice) * item.quantity;
    itemCount += item.quantity;
  }

  return {
    subtotal: subtotal.toFixed(2),
    discount: discount.toFixed(2),
    shipping: "0.00",
    total: (subtotal - discount).toFixed(2),
    item_count: itemCount,
    line_count: items.length,
  };
}

function withItems(items: CartItem[]): Cart {
  return { items, totals: estimateTotals(items) };
}

async function optimisticallyUpdate(
  queryClient: QueryClient,
  apply: (cart: Cart) => Cart
): Promise<{ previous: Cart | undefined }> {
  await queryClient.cancelQueries({ queryKey: CART_QUERY_KEY });
  const previous = queryClient.getQueryData<Cart>(CART_QUERY_KEY);
  queryClient.setQueryData<Cart>(CART_QUERY_KEY, (current) =>
    apply(current ?? EMPTY_CART)
  );
  return { previous };
}

function rollback(
  queryClient: QueryClient,
  context: { previous: Cart | undefined } | undefined
) {
  if (context?.previous !== undefined) {
    queryClient.setQueryData(CART_QUERY_KEY, context.previous);
  }
}

export function useCart() {
  const { isAuthenticated } = useAuth();

  return useQuery<Cart>({
    queryKey: CART_QUERY_KEY,
    queryFn: fetchCart,
    enabled: isAuthenticated,
  });
}

export function useCartCount(): number {
  const { data } = useCart();
  return data?.totals.item_count ?? 0;
}

export interface AddToCartVariables extends AddCartItemPayload {
  optimisticProduct?: CartProduct;
}

export function useAddToCart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables: AddToCartVariables) =>
      addCartItem({
        product_id: variables.product_id,
        size: variables.size,
        color: variables.color,
        quantity: variables.quantity,
      }),

    onMutate: (variables) =>
      optimisticallyUpdate(queryClient, (cart) => {
        const { optimisticProduct, product_id, quantity = 1 } = variables;
        const size = variables.size ?? "";
        const color = variables.color ?? "";

        const existing = cart.items.find(
          (item) =>
            item.product.id === product_id &&
            item.size === size &&
            item.color === color
        );

        if (existing) {
          return withItems(
            cart.items.map((item) =>
              item.id === existing.id
                ? { ...item, quantity: item.quantity + quantity }
                : item
            )
          );
        }

        if (!optimisticProduct) return cart;

        const unitPrice =
          optimisticProduct.discount_price ?? optimisticProduct.price;

        const placeholder: CartItem = {
          id: -Date.now(),
          product: optimisticProduct,
          size,
          color,
          quantity,
          unit_price: unitPrice,
          line_total: (Number(unitPrice) * quantity).toFixed(2),
          added_at: new Date().toISOString(),
        };
        return withItems([placeholder, ...cart.items]);
      }),

    onError: (_error, _variables, context) => rollback(queryClient, context),
    onSuccess: (cart) => queryClient.setQueryData(CART_QUERY_KEY, cart),
  });
}

export function useUpdateCartItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ itemId, quantity }: { itemId: number; quantity: number }) =>
      updateCartItem(itemId, quantity),

    onMutate: ({ itemId, quantity }) =>
      optimisticallyUpdate(queryClient, (cart) =>
        withItems(
          cart.items.map((item) =>
            item.id === itemId
              ? {
                  ...item,
                  quantity,
                  line_total: (Number(item.unit_price) * quantity).toFixed(2),
                }
              : item
          )
        )
      ),

    onError: (_error, _variables, context) => rollback(queryClient, context),
    onSuccess: (cart) => queryClient.setQueryData(CART_QUERY_KEY, cart),
  });
}

export function useRemoveCartItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (itemId: number) => removeCartItem(itemId),

    onMutate: (itemId) =>
      optimisticallyUpdate(queryClient, (cart) =>
        withItems(cart.items.filter((item) => item.id !== itemId))
      ),

    onError: (_error, _variables, context) => rollback(queryClient, context),
    onSuccess: (cart) => queryClient.setQueryData(CART_QUERY_KEY, cart),
  });
}

export function useClearCart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: clearCart,
    onMutate: () => optimisticallyUpdate(queryClient, () => EMPTY_CART),
    onError: (_error, _variables, context) => rollback(queryClient, context),
    onSuccess: (cart) => queryClient.setQueryData(CART_QUERY_KEY, cart),
  });
}
