import { createPortal } from "react-dom";
import type { Facets, ProductFilters } from "../../api/products";
import { FACET_LABELS, FACET_ORDER, type FacetKey, toggleValue } from "../../lib/facets";
import FacetOptionRow from "./FacetOptionRow";

export default function FilterSheet({
  open,
  filters,
  facets,
  count,
  onChange,
  onClose,
}: {
  open: boolean;
  filters: ProductFilters;
  facets?: Facets;
  count: number;
  onChange: (next: ProductFilters) => void;
  onClose: () => void;
}) {
  if (!open) return null;

  function setFacet(key: FacetKey, value: string) {
    onChange({ ...filters, [key]: toggleValue(filters[key], value) });
  }

  return createPortal(
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="absolute right-0 top-0 flex h-full w-[320px] max-w-[90vw] flex-col bg-white shadow-[0_16px_48px_rgba(0,0,0,0.12)]">
        <div className="flex items-center justify-between border-b border-[#E5E5E5] px-6 py-4">
          <span className="text-sm font-semibold uppercase tracking-[0.15em] text-[#1A1A1A]">
            Filters
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close filters"
            className="text-lg text-[#777] hover:text-[#1A1A1A]"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-2">
          {FACET_ORDER.map((key) => (
            <div key={key} className="border-b border-[#E5E5E5] py-4">
              <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#777]">
                {FACET_LABELS[key]}
              </h3>
              {(facets?.[key] ?? []).map((option) => (
                <FacetOptionRow
                  key={option.value}
                  label={option.label}
                  count={option.count}
                  active={(filters[key] ?? []).includes(option.value)}
                  onClick={() => setFacet(key, option.value)}
                />
              ))}
            </div>
          ))}

          <div className="py-4">
            <h3 className="mb-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#777]">
              Price
            </h3>
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Min"
                value={filters.min_price ?? ""}
                onChange={(e) =>
                  onChange({ ...filters, min_price: e.target.value || undefined })
                }
                className="w-full px-3 py-2 bg-[#F9F7F4] text-sm text-[#1A1A1A] placeholder-[#AAA] outline-none focus:ring-1 focus:ring-[#1A1A1A]"
              />
              <input
                type="number"
                placeholder="Max"
                value={filters.max_price ?? ""}
                onChange={(e) =>
                  onChange({ ...filters, max_price: e.target.value || undefined })
                }
                className="w-full px-3 py-2 bg-[#F9F7F4] text-sm text-[#1A1A1A] placeholder-[#AAA] outline-none focus:ring-1 focus:ring-[#1A1A1A]"
              />
            </div>
          </div>
        </div>

        <div className="border-t border-[#E5E5E5] p-6">
          <button
            type="button"
            onClick={onClose}
            className="w-full bg-[#1A1A1A] py-3 text-xs font-semibold uppercase tracking-[0.15em] text-white"
          >
            Show {count} item{count === 1 ? "" : "s"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
