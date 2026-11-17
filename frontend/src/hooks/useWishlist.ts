import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { QueryClient } from "@tanstack/react-query";
import {
  fetchWishlist,
  removeWishlistItem,
  toggleWishlist,
  type ToggleWishlistPayload,
  type WishlistItem,
  type WishlistProduct,
} from "../api/wishlist";
import { useAuth } from "../context/AuthContext";

export const WISHLIST_QUERY_KEY = ["wishlist"] as const;

async function optimisticallyUpdate(
  queryClient: QueryClient,
  apply: (items: WishlistItem[]) => WishlistItem[]
): Promise<{ previous: WishlistItem[] | undefined }> {
  await queryClient.cancelQueries({ queryKey: WISHLIST_QUERY_KEY });
  const previous = queryClient.getQueryData<WishlistItem[]>(WISHLIST_QUERY_KEY);
  queryClient.setQueryData<WishlistItem[]>(WISHLIST_QUERY_KEY, (current) =>
    apply(current ?? [])
  );
  return { previous };
}

function rollback(
  queryClient: QueryClient,
  context: { previous: WishlistItem[] | undefined } | undefined
) {
  if (context?.previous !== undefined) {
    queryClient.setQueryData(WISHLIST_QUERY_KEY, context.previous);
  }
  queryClient.invalidateQueries({ queryKey: WISHLIST_QUERY_KEY });
}

export function useWishlist() {
  const { isAuthenticated } = useAuth();

  return useQuery<WishlistItem[]>({
    queryKey: WISHLIST_QUERY_KEY,
    queryFn: fetchWishlist,
    enabled: isAuthenticated,
  });
}

export function useIsSaved(productId: number): boolean {
  const { data } = useWishlist();
  return data?.some((item) => item.product.id === productId) ?? false;
}

export function useWishlistCount(): number {
  const { data } = useWishlist();
  return data?.length ?? 0;
}

export interface ToggleWishlistVariables extends ToggleWishlistPayload {
  optimisticProduct?: WishlistProduct;
}

export function useToggleWishlist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables: ToggleWishlistVariables) =>
      toggleWishlist({
        product_id: variables.product_id,
        source: variables.source,
      }),

    onMutate: (variables) =>
      optimisticallyUpdate(queryClient, (items) => {
        const { product_id, optimisticProduct, source = "manual" } = variables;
        const existing = items.find((item) => item.product.id === product_id);

        if (existing) {
          return items.filter((item) => item.product.id !== product_id);
        }
        if (!optimisticProduct) return items;

        const placeholder: WishlistItem = {
          id: -Date.now(),
          product: optimisticProduct,
          source,
          in_stock: true,
          added_at: new Date().toISOString(),
        };
        return [placeholder, ...items];
      }),

    onError: (_error, _variables, context) => rollback(queryClient, context),

    onSuccess: (response) => {
      queryClient.setQueryData<WishlistItem[]>(
        WISHLIST_QUERY_KEY,
        (items = []) => {
          const without = items.filter(
            (item) => item.product.id !== response.product_id
          );
          return response.item ? [response.item, ...without] : without;
        }
      );
    },
  });
}

export function useRemoveWishlistItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (itemId: number) => removeWishlistItem(itemId),
    onMutate: (itemId) =>
      optimisticallyUpdate(queryClient, (items) =>
        items.filter((item) => item.id !== itemId)
      ),
    onError: (_error, _variables, context) => rollback(queryClient, context),
  });
}
