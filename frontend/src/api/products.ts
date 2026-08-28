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
  /** Primary image, sent by the list/detail endpoints. Detail also sends `images`. */
  image_url?: string | null;
  images?: ProductImage[];
}
export interface Facet {
  value: string;
  label: string;
  count: number;
}

export interface Facets {
  category: Facet[];
  gender: Facet[];
  brand: Facet[];
  color: Facet[];
  size: Facet[];
}

export interface ProductsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Product[];
  facets: Facets;
}

// category/gender/brand/color/size are multi-select (repeated query keys —
// see 11.5); min_price/max_price/search/ordering stay single-valued.
const MULTI_VALUE_KEYS = ["category", "gender", "brand", "color", "size"] as const;
const SINGLE_VALUE_KEYS = ["min_price", "max_price", "search", "ordering"] as const;

export interface ProductFilters {
  category?: string[];
  gender?: string[];
  brand?: string[];
  color?: string[];
  size?: string[];
  min_price?: string;
  max_price?: string;
  search?: string;
  ordering?: string;
}

export interface ProductImage {
  id: number;
  image_url: string;
  is_primary: boolean;
  display_order: number;
}

/**
 * Shared by both the router's `?search=` string and the API request: they're
 * the same shape, so one function builds both. Axios's default array
 * serialization encodes `color: ["Black"]` as `color[]=Black`, which
 * `request.query_params.getlist("color")` on the backend never sees — a
 * pre-built `URLSearchParams` with repeated bare keys is what the API and
 * `QueryDict.getlist()` both expect.
 */
export function buildFilterParams(filters: ProductFilters): URLSearchParams {
  const params = new URLSearchParams();
  for (const key of MULTI_VALUE_KEYS) {
    for (const value of filters[key] ?? []) params.append(key, value);
  }
  for (const key of SINGLE_VALUE_KEYS) {
    const value = filters[key];
    if (value) params.set(key, value);
  }
  return params;
}

export function filtersFromSearchParams(searchParams: URLSearchParams): ProductFilters {
  const filters: ProductFilters = {};
  for (const key of MULTI_VALUE_KEYS) {
    const values = searchParams.getAll(key);
    if (values.length) filters[key] = values;
  }
  for (const key of SINGLE_VALUE_KEYS) {
    const value = searchParams.get(key);
    if (value) filters[key] = value;
  }
  return filters;
}

export async function fetchProducts(
  pageUrl?: string,
  filters?: ProductFilters
): Promise<ProductsResponse> {
  if (pageUrl) {
    // The page URL already has every param baked in from DRF.
    const response = await api.get<ProductsResponse>(pageUrl);
    return response.data;
  }
  const response = await api.get<ProductsResponse>("/products/", {
    params: filters ? buildFilterParams(filters) : undefined,
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
