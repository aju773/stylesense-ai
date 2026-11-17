import { useSearchParams } from "react-router";
import { useProducts } from "../hooks/useProducts";
import { useDebounce } from "../hooks/useDebounce";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { buildFilterParams, filtersFromSearchParams, type ProductFilters } from "../api/products";
import ProductCard from "../components/products/ProductCard";
import FilterBar from "../components/products/FilterBar";

export default function Products() {
  useDocumentTitle("Shop");
  const [searchParams, setSearchParams] = useSearchParams();

  const filters = filtersFromSearchParams(searchParams);
  const debouncedFilters = useDebounce(filters, 400);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useProducts(debouncedFilters);

  function handleFilterChange(next: ProductFilters) {
    setSearchParams(buildFilterParams(next));
  }

  const products = data?.pages.flatMap((page) => page.results) ?? [];
  const facets = data?.pages[0]?.facets;
  const count = data?.pages[0]?.count ?? 0;

  return (
    <div>
      <div className="max-w-[1280px] mx-auto px-4 lg:px-8 pt-12 pb-6">
        <h1 className="font-display text-4xl text-[#1A1A1A]">Shop</h1>
      </div>

      <FilterBar
        filters={filters}
        onChange={handleFilterChange}
        facets={facets}
        count={count}
      />

      <div className="max-w-[1280px] mx-auto px-4 lg:px-8 py-8">
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
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-5 gap-y-10">
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
  );
}
