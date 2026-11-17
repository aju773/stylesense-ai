import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import {
  fetchProducts,
  fetchCategories,
  type ProductsResponse,
  type ProductFilters,
  type Category,
} from "../api/products";
export function useProducts(filters?: ProductFilters) {
  return useInfiniteQuery<ProductsResponse>({
    queryKey: ["products", filters],
    queryFn: ({ pageParam }) =>
      fetchProducts(pageParam as string | undefined, filters),
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => lastPage.next,
  });
}
export function useCategories() {
  return useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: fetchCategories,
    staleTime: 10 * 60 * 1000,
  });
}
