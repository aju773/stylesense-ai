// Shared between FilterBar's desktop popovers and FilterSheet's mobile sheet
// — both render the same five facet dimensions and toggle values the same way.

export type FacetKey = "category" | "gender" | "brand" | "color" | "size";

export const FACET_ORDER: FacetKey[] = ["category", "gender", "brand", "color", "size"];

export const FACET_LABELS: Record<FacetKey, string> = {
  category: "Category",
  gender: "Gender",
  brand: "Brand",
  color: "Colour",
  size: "Size",
};

export function toggleValue(current: string[] | undefined, value: string): string[] {
  const list = current ?? [];
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}
