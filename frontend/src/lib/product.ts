// Shared presentation helpers for product cards (catalog grid + AI chat strip).

// Deterministic gradient based on product name — same product always gets the
// same colors. Stands in for the image while the catalog has no images.
const gradients = [
  "from-[#E8E0D8] to-[#D4C5B5]",
  "from-[#D8DDE8] to-[#B5BFD4]",
  "from-[#E8D8DE] to-[#D4B5C0]",
  "from-[#D8E8E0] to-[#B5D4C5]",
  "from-[#E0D8E8] to-[#C5B5D4]",
  "from-[#E8E4D8] to-[#D4CDB5]",
];

export function getGradient(name: string) {
  let hash = 0;
  for (const ch of name) hash = (hash + ch.charCodeAt(0)) % gradients.length;
  return gradients[hash];
}

export function formatPrice(price: string) {
  return `₹${Number(price).toLocaleString("en-IN")}`;
}
