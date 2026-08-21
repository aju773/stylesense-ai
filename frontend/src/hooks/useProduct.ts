import { useQuery } from "@tanstack/react-query";
import { fetchProduct, type Product } from "../api/products";

export function useProduct(slug: string) {
  return useQuery<Product>({
    queryKey: ["product", slug],
    queryFn: () => fetchProduct(slug),
  });
}
