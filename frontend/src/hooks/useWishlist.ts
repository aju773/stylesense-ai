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

/**
 * Shared optimistic scaffolding, mirroring `useCart`: cancel in-flight
 * refetches so a stale response can't overwrite the optimistic state, snapshot
 * the cache, then apply. The snapshot is what `onError` restores.
 */
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

/**
 * Restore the snapshot, then reconcile with the server.
 *
 * The rollback alone can restore a row that is genuinely gone — a failed
 * remove is usually a 404, meaning someone else already deleted it — so the
 * snapshot is only correct until the refetch lands. Same reasoning as
 * `usePlaceOrder` invalidating the cart on error: the failure itself is
 * evidence the client's picture is stale.
 */
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
    // Saves are authenticated-only — asking while logged out just 401s and
    // spins a retry loop.
    enabled: isAuthenticated,
  });
}

/**
 * Whether this product is saved. Every heart on the page reads the one
 * `["wishlist"]` cache, so a save made on a card is reflected instantly by the
 * same product's heart in the chat strip or on its detail page.
 */
export function useIsSaved(productId: number): boolean {
  const { data } = useWishlist();
  return data?.some((item) => item.product.id === productId) ?? false;
}

/** Count for the header link — 0 while logged out or still loading. */
export function useWishlistCount(): number {
  const { data } = useWishlist();
  return data?.length ?? 0;
}

export interface ToggleWishlistVariables extends ToggleWishlistPayload {
  /**
   * Product data for the optimistic placeholder row. Optional: without it the
   * save still works, the wishlist page just shows nothing for it until the
   * server answers.
   */
  optimisticProduct?: WishlistProduct;
}

export function useToggleWishlist() {
  const queryClient = useQueryClient();

  return useMutation({
    // `optimisticProduct` is client-side only — the server is told the id.
    mutationFn: (variables: ToggleWishlistVariables) =>
      toggleWishlist({
        product_id: variables.product_id,
        source: variables.source,
      }),

    onMutate: (variables) =>
      optimisticallyUpdate(queryClient, (items) => {
        const { product_id, optimisticProduct, source = "manual" } = variables;
        const existing = items.find((item) => item.product.id === product_id);

        // Mirrors the server's decision: saved becomes unsaved and vice versa.
        if (existing) {
          return items.filter((item) => item.product.id !== product_id);
        }
        if (!optimisticProduct) return items;

        // Negative id marks a placeholder with no server row yet; `onSuccess`
        // replaces it with the real one, so it never survives a round-trip.
        const placeholder: WishlistItem = {
          id: -Date.now(),
          product: optimisticProduct,
          source,
          // The hearts live on cards that don't carry stock. Only the wishlist
          // page reads this, and by the time it renders the server has replaced
          // the row with the truth.
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

/**
 * Unsave a known row. The wishlist page's heart only ever removes, so it uses
 * this rather than the toggle — through a toggle, an impatient double-click
 * there would remove and then save the product again.
 */
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
