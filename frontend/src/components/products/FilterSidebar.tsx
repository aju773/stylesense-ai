import { useCategories } from "../../hooks/useProducts";
import type { ProductFilters } from "../../api/products";
interface FilterSidebarProps {
  filters: ProductFilters;
  onChange: (filters: ProductFilters) => void;
}
// Known values — from DEC-013, we show all possible values (not cascading)
const GENDERS = ["Men", "Women", "Unisex"];
const SIZES = ["XS", "S", "M", "L", "XL", "XXL"];
const COLORS = [
  "Black", "White", "Red", "Blue", "Green",
  "Beige", "Pink", "Navy", "Grey", "Brown",
];
export default function FilterSidebar({ filters, onChange }: FilterSidebarProps) {
  const { data: categories } = useCategories();
  function set(key: keyof ProductFilters, value: string) {
    // Toggle: if same value clicked again, clear it
    const next = { ...filters };
    if (next[key] === value) {
      delete next[key];
    } else {
      next[key] = value;
    }
    onChange(next);
  }
  function clearAll() {
    onChange({});
  }
  const hasFilters = Object.keys(filters).length > 0;
  return (
    <aside className="w-full lg:w-[260px] shrink-0">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xs font-semibold tracking-[0.15em] uppercase text-[#1A1A1A]">
          Filters
        </h2>
        {hasFilters && (
          <button
            onClick={clearAll}
            className="text-xs text-[#777] hover:text-[#1A1A1A] transition-colors underline underline-offset-4"
          >
            Clear All
          </button>
        )}
      </div>
      {/* Category */}
      <FilterSection title="Category">
        {categories?.map((cat) => (
          <FilterChip
            key={cat.slug}
            label={cat.name}
            active={filters.category === cat.slug}
            onClick={() => set("category", cat.slug)}
          />
        ))}
      </FilterSection>
      {/* Gender */}
      <FilterSection title="Gender">
        {GENDERS.map((g) => (
          <FilterChip
            key={g}
            label={g}
            active={filters.gender === g}
            onClick={() => set("gender", g)}
          />
        ))}
      </FilterSection>
      {/* Price Range */}
      <FilterSection title="Price">
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Min"
            value={filters.min_price ?? ""}
            onChange={(e) =>
              onChange({
                ...filters,
                min_price: e.target.value || undefined,
              })
            }
            className="w-full px-3 py-2 bg-[#F9F7F4] text-sm text-[#1A1A1A] placeholder-[#AAA] outline-none focus:ring-1 focus:ring-[#1A1A1A]"
          />
          <input
            type="number"
            placeholder="Max"
            value={filters.max_price ?? ""}
            onChange={(e) =>
              onChange({
                ...filters,
                max_price: e.target.value || undefined,
              })
            }
            className="w-full px-3 py-2 bg-[#F9F7F4] text-sm text-[#1A1A1A] placeholder-[#AAA] outline-none focus:ring-1 focus:ring-[#1A1A1A]"
          />
        </div>
      </FilterSection>
      {/* Size */}
      <FilterSection title="Size">
        <div className="flex flex-wrap gap-2">
          {SIZES.map((s) => (
            <button
              key={s}
              onClick={() => set("size", s)}
              className={`px-3 py-1.5 text-xs border transition-colors ${
                filters.size === s
                  ? "bg-[#1A1A1A] text-white border-[#1A1A1A]"
                  : "border-[#E5E5E5] text-[#333] hover:border-[#1A1A1A]"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </FilterSection>
      {/* Color */}
      <FilterSection title="Color">
        <div className="flex flex-wrap gap-2">
          {COLORS.map((c) => (
            <FilterChip
              key={c}
              label={c}
              active={filters.color === c}
              onClick={() => set("color", c)}
            />
          ))}
        </div>
      </FilterSection>
    </aside>
  );
}
// --- Small sub-components (same file, no need for separate files) ---
function FilterSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="py-4 border-b border-[#E5E5E5]">
      <h3 className="text-xs font-semibold tracking-[0.1em] uppercase text-[#777] mb-3">
        {title}
      </h3>
      {children}
    </div>
  );
}
function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`block w-full text-left px-2 py-1.5 text-sm transition-colors ${
        active
          ? "text-[#1A1A1A] font-semibold"
          : "text-[#777] hover:text-[#1A1A1A]"
      }`}
    >
      {active && "· "}{label}
    </button>
  );
}
