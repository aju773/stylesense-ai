import { useState, type ReactNode } from "react";
import type { Facet, Facets, ProductFilters } from "../../api/products";
import { FACET_LABELS, FACET_ORDER, type FacetKey, toggleValue } from "../../lib/facets";
import { formatPrice } from "../../lib/product";
import FacetOptionRow from "./FacetOptionRow";
import FilterSheet from "./FilterSheet";

const SORTS = [
  { value: "recommended", label: "Recommended" },
  { value: "price", label: "Price: Low to High" },
  { value: "-price", label: "Price: High to Low" },
  { value: "-rating", label: "Top Rated" },
  { value: "-created_at", label: "Newest" },
];

function activeCount(filters: ProductFilters) {
  let n = 0;
  for (const key of FACET_ORDER) n += filters[key]?.length ?? 0;
  if (filters.min_price || filters.max_price) n += 1;
  return n;
}

function priceChipLabel(min?: string, max?: string) {
  if (min && max) return `${formatPrice(min)} – ${formatPrice(max)}`;
  if (min) return `From ${formatPrice(min)}`;
  if (max) return `Under ${formatPrice(max)}`;
  return null;
}

function PopoverButton({
  label,
  count,
  active,
  open,
  onClick,
}: {
  label: string;
  count?: number;
  active: boolean;
  open: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold uppercase tracking-[0.1em] transition-colors ${
        active ? "text-[#1A1A1A]" : "text-[#777] hover:text-[#1A1A1A]"
      }`}
    >
      {label}
      {!!count && (
        <span className="rounded-full bg-[#1A1A1A] px-1.5 text-[10px] text-white tabular-nums">
          {count}
        </span>
      )}
      <span className="text-[8px] opacity-50">{open ? "▲" : "▼"}</span>
    </button>
  );
}

function PopoverPanel({ children, wide = false }: { children: ReactNode; wide?: boolean }) {
  return (
    <div
      className={`absolute left-0 top-full z-30 max-h-[320px] overflow-y-auto border border-[#E5E5E5] bg-white p-3 shadow-[0_16px_48px_rgba(0,0,0,0.12)] ${
        wide ? "w-[260px]" : "w-[220px]"
      }`}
    >
      {children}
    </div>
  );
}

function FacetPopover({
  facetKey,
  label,
  options,
  selected,
  open,
  onToggleOpen,
  onSelect,
}: {
  facetKey: FacetKey;
  label: string;
  options: Facet[];
  selected: string[];
  open: boolean;
  onToggleOpen: () => void;
  onSelect: (value: string) => void;
}) {
  return (
    <div className="relative">
      <PopoverButton
        label={label}
        count={selected.length}
        active={selected.length > 0}
        open={open}
        onClick={onToggleOpen}
      />
      {open && (
        <PopoverPanel>
          {options.map((option) => (
            <FacetOptionRow
              key={`${facetKey}-${option.value}`}
              label={option.label}
              count={option.count}
              active={selected.includes(option.value)}
              onClick={() => onSelect(option.value)}
            />
          ))}
        </PopoverPanel>
      )}
    </div>
  );
}

function PricePopover({
  open,
  onToggleOpen,
  minPrice,
  maxPrice,
  onChangeMin,
  onChangeMax,
  active,
}: {
  open: boolean;
  onToggleOpen: () => void;
  minPrice?: string;
  maxPrice?: string;
  onChangeMin: (value: string) => void;
  onChangeMax: (value: string) => void;
  active: boolean;
}) {
  return (
    <div className="relative">
      <PopoverButton label="Price" active={active} open={open} onClick={onToggleOpen} />
      {open && (
        <PopoverPanel wide>
          <div className="flex gap-2 p-1">
            <input
              type="number"
              placeholder="Min"
              value={minPrice ?? ""}
              onChange={(e) => onChangeMin(e.target.value)}
              className="w-full px-3 py-2 bg-[#F9F7F4] text-sm text-[#1A1A1A] placeholder-[#AAA] outline-none focus:ring-1 focus:ring-[#1A1A1A]"
            />
            <input
              type="number"
              placeholder="Max"
              value={maxPrice ?? ""}
              onChange={(e) => onChangeMax(e.target.value)}
              className="w-full px-3 py-2 bg-[#F9F7F4] text-sm text-[#1A1A1A] placeholder-[#AAA] outline-none focus:ring-1 focus:ring-[#1A1A1A]"
            />
          </div>
        </PopoverPanel>
      )}
    </div>
  );
}

function SortSelect({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <label className="flex items-center gap-2 text-xs text-[#777] whitespace-nowrap">
      <span className="hidden sm:inline">Sort by:</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="border-none bg-transparent text-xs font-semibold text-[#1A1A1A] outline-none"
      >
        {SORTS.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>
    </label>
  );
}

interface FilterBarProps {
  filters: ProductFilters;
  onChange: (next: ProductFilters) => void;
  facets?: Facets;
  count: number;
}

/**
 * Replaces the left filter rail (4.4) with a top bar of facet popovers over a
 * full-width grid. Instant apply — no draft-then-Apply state — matching the
 * popover variant the 11.6 prototype measured as the only layout that shows
 * counts, holds all six facets, and stays at 56px.
 */
export default function FilterBar({ filters, onChange, facets, count }: FilterBarProps) {
  const [openDesktop, setOpenDesktop] = useState<FacetKey | "price" | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  function setFacet(key: FacetKey, value: string) {
    onChange({ ...filters, [key]: toggleValue(filters[key], value) });
  }

  function setPrice(key: "min_price" | "max_price", value: string) {
    onChange({ ...filters, [key]: value || undefined });
  }

  function clearAll() {
    // search/ordering aren't facets — clearing filters shouldn't blow away a
    // search query or the shopper's chosen sort.
    onChange({ search: filters.search, ordering: filters.ordering });
  }

  const active = activeCount(filters);
  const priceLabel = priceChipLabel(filters.min_price, filters.max_price);

  const chips: { key: string; label: string; onRemove: () => void }[] = [];
  for (const key of FACET_ORDER) {
    for (const value of filters[key] ?? []) {
      chips.push({
        key: `${key}:${value}`,
        label: value,
        onRemove: () => setFacet(key, value),
      });
    }
  }
  if (priceLabel) {
    chips.push({
      key: "price",
      label: priceLabel,
      onRemove: () => onChange({ ...filters, min_price: undefined, max_price: undefined }),
    });
  }

  const sortValue = filters.ordering ?? "recommended";
  function handleSortChange(next: string) {
    onChange({ ...filters, ordering: next === "recommended" ? undefined : next });
  }

  return (
    <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-[#E5E5E5]">
      <div className="max-w-[1280px] mx-auto px-4 lg:px-8">
        {/* Desktop — six facet popovers in a row */}
        <div
          className="hidden lg:flex items-center gap-1 py-3"
          onMouseLeave={() => setOpenDesktop(null)}
        >
          {FACET_ORDER.map((key) => (
            <FacetPopover
              key={key}
              facetKey={key}
              label={FACET_LABELS[key]}
              options={facets?.[key] ?? []}
              selected={filters[key] ?? []}
              open={openDesktop === key}
              onToggleOpen={() => setOpenDesktop(openDesktop === key ? null : key)}
              onSelect={(value) => setFacet(key, value)}
            />
          ))}
          <PricePopover
            open={openDesktop === "price"}
            onToggleOpen={() => setOpenDesktop(openDesktop === "price" ? null : "price")}
            minPrice={filters.min_price}
            maxPrice={filters.max_price}
            onChangeMin={(v) => setPrice("min_price", v)}
            onChangeMax={(v) => setPrice("max_price", v)}
            active={!!priceLabel}
          />
          <div className="ml-auto flex items-center gap-4">
            <span className="text-xs tabular-nums text-[#777] whitespace-nowrap">
              {count} item{count === 1 ? "" : "s"}
            </span>
            <SortSelect value={sortValue} onChange={handleSortChange} />
          </div>
        </div>

        {/* Mobile — one trigger, the sheet does the rest */}
        <div className="flex lg:hidden items-center gap-3 py-3">
          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            className="flex items-center gap-2 border border-[#1A1A1A] px-4 py-2 text-xs font-semibold uppercase tracking-[0.15em] text-[#1A1A1A]"
          >
            Filters{active > 0 ? ` (${active})` : ""}
          </button>
          <span className="ml-auto text-xs tabular-nums text-[#777] whitespace-nowrap">
            {count} item{count === 1 ? "" : "s"}
          </span>
          <SortSelect value={sortValue} onChange={handleSortChange} />
        </div>

        {/* Chip row — both signals ship: the badge says how many, chips say
            which. Price only ever appears here — a range has nothing to
            badge a popover button with. */}
        {chips.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 pb-3">
            {chips.map((chip) => (
              <span
                key={chip.key}
                className="inline-flex items-center gap-1.5 bg-[#F9F7F4] px-3 py-1.5 text-xs text-[#333]"
              >
                {chip.label}
                <button
                  type="button"
                  onClick={chip.onRemove}
                  className="text-[#AAA] hover:text-[#1A1A1A]"
                >
                  ✕
                </button>
              </span>
            ))}
            <button
              type="button"
              onClick={clearAll}
              className="text-xs text-[#777] underline underline-offset-4 hover:text-[#1A1A1A]"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      <FilterSheet
        open={sheetOpen}
        filters={filters}
        facets={facets}
        count={count}
        onChange={onChange}
        onClose={() => setSheetOpen(false)}
      />
    </div>
  );
}
