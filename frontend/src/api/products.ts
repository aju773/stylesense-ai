import api from "./axios";
export interface Category {
  id: number;
  name: string;
  slug: string;
}
export interface Product {
  id: number;
  name: string;
  slug: string;
  description: string;
  price: string;
  discount_price: string | null;
  brand: string;
  sizes: string[];
  colors: string[];
  gender: string;
  stock: number;
  rating: string;
  category: Category;
  images?: ProductImage[];
}
export interface ProductsResponse {
  next: string | null;
  previous: string | null;
  results: Product[];
}

export interface ProductFilters {
  category?: string;
  gender?: string;
  brand?: string;
  min_price?: string;
  max_price?: string;
  color?: string;
  size?: string;
  search?: string;
}

export interface ProductImage {
  id: number;
  image_url: string;
  is_primary: boolean;
  display_order: number;
}

export async function fetchProducts(
  cursor?: string,
  filters?: ProductFilters
): Promise<ProductsResponse> {
  if (cursor) {
    // Cursor URL already has all params baked in from DRF
    const response = await api.get<ProductsResponse>(cursor);
    return response.data;
  }
  const response = await api.get<ProductsResponse>("/products/", {
    params: filters,
  });
  return response.data;
}

export async function fetchProduct(slug: string): Promise<Product> {
  const response = await api.get<Product>(`/products/${slug}/`);
  return response.data;
}

export async function fetchCategories(): Promise<Category[]> {
  const response = await api.get<Category[]>("/products/categories/");
  return response.data;
}
