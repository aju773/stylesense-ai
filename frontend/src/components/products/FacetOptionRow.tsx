/**
 * One checkbox row inside a facet popover or the mobile sheet — shared so the
 * zero-count-stays-visible-but-disabled rule only has one implementation.
 * A `0` is never hidden: it tells the shopper "Levi's makes no dresses"
 * instead of Levi's silently vanishing from the list.
 */
export default function FacetOptionRow({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  const dead = count === 0 && !active;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={dead}
      className={`flex w-full items-center gap-2.5 px-1 py-1.5 text-left text-sm transition-colors ${
        dead ? "cursor-not-allowed text-[#AAA]" : "text-[#333] hover:text-[#1A1A1A]"
      }`}
    >
      <span
        className={`inline-flex h-4 w-4 shrink-0 items-center justify-center border transition-colors ${
          active ? "border-[#1A1A1A] bg-[#1A1A1A] text-white" : "border-[#AAA] bg-white"
        }`}
      >
        {active && <span className="text-[10px] leading-none">✓</span>}
      </span>
      <span className="flex-1 truncate">{label}</span>
      <span className="tabular-nums text-xs text-[#AAA]">{count}</span>
    </button>
  );
}
