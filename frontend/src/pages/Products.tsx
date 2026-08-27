import { useState } from "react";
import { useSearchParams } from "react-router";
import { useProducts } from "../hooks/useProducts";
import { useDebounce } from "../hooks/useDebounce";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import type { ProductFilters } from "../api/products";
import ProductCard from "../components/products/ProductCard";
import FilterSidebar from "../components/products/FilterSidebar";

const FILTER_KEYS: (keyof ProductFilters)[] = [
  "category", "gender", "brand", "min_price", "max_price", "color", "size", "search",
];

function filtersFromParams(params: URLSearchParams): ProductFilters {
  const filters: ProductFilters = {};
  for (const key of FILTER_KEYS) {
    const value = params.get(key);
    if (value) filters[key] = value;
  }
  return filters;
}

export default function Products() {
  useDocumentTitle("Shop");
  const [searchParams, setSearchParams] = useSearchParams();
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const filters = filtersFromParams(searchParams);
  const debouncedFilters = useDebounce(filters, 400);
  const hasFilters = Object.keys(filters).length > 0;

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useProducts(debouncedFilters);

  function handleFilterChange(next: ProductFilters) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(next)) {
      if (value) params.set(key, value);
    }
    setSearchParams(params);
  }

  const products = data?.pages.flatMap((page) => page.results) ?? [];

  return (
    <div className="max-w-[1280px] mx-auto px-4 py-12">
      {/* Page header */}
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="font-display text-4xl text-[#1A1A1A] mb-2">
            Shop
          </h1>
          <p className="text-sm text-[#777]">
            {isLoading
              ? "Loading…"
              : `${products.length} product${products.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        {/* Mobile filter toggle */}
        <button
          onClick={() => setMobileFiltersOpen(true)}
          className="lg:hidden flex items-center gap-2 px-4 py-2 border border-[#1A1A1A] text-xs font-semibold tracking-[0.1em] uppercase"
        >
          Filters{hasFilters ? ` (${Object.keys(filters).length})` : ""}
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Desktop sidebar */}
        <div className="hidden lg:block">
          <FilterSidebar filters={filters} onChange={handleFilterChange} />
        </div>

        {/* Mobile overlay */}
        {mobileFiltersOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setMobileFiltersOpen(false)}
            />
            <div className="absolute right-0 top-0 h-full w-[300px] bg-white p-6 overflow-y-auto shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <span className="text-sm font-semibold tracking-[0.1em] uppercase">
                  Filters
                </span>
                <button
                  onClick={() => setMobileFiltersOpen(false)}
                  className="text-[#777] hover:text-[#1A1A1A] text-xl"
                >
                  ✕
                </button>
              </div>
              <FilterSidebar filters={filters} onChange={handleFilterChange} />
            </div>
          </div>
        )}

        {/* Product grid */}
        <div className="flex-1">
          {/* Active filter chips */}
          {hasFilters && (
            <div className="flex flex-wrap gap-2 mb-6">
              {Object.entries(filters).map(([key, value]) => (
                <span
                  key={key}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#F9F7F4] text-xs text-[#333]"
                >
                  <span className="text-[#777]">{key}:</span> {value}
                  <button
                    onClick={() => {
                      const next = { ...filters };
                      delete next[key as keyof ProductFilters];
                      handleFilterChange(next);
                    }}
                    className="text-[#AAA] hover:text-[#1A1A1A] ml-1"
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
          )}

          {isError ? (
            <p className="text-[#D64045] text-sm">
              Something went wrong loading products.
            </p>
          ) : isLoading ? (
            <div className="flex items-center justify-center min-h-[40vh]">
              <p className="text-[#777] text-sm tracking-[0.1em] uppercase">
                Loading…
              </p>
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3">
              <p className="text-[#777] text-sm">
                No products match your filters.
              </p>
              <button
                onClick={() => setSearchParams({})}
                className="text-sm text-[#1A1A1A] underline underline-offset-4 hover:no-underline"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-8">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {hasNextPage && (
                <div className="flex justify-center mt-12">
                  <button
                    onClick={() => fetchNextPage()}
                    disabled={isFetchingNextPage}
                    className="h-12 px-8 border border-[#1A1A1A] text-xs font-semibold tracking-[0.15em] uppercase text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isFetchingNextPage ? "Loading…" : "Load More"}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
