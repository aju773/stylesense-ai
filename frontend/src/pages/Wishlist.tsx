import { useState } from "react";
import { Link } from "react-router";
import WishlistCard from "../components/wishlist/WishlistCard";
import { useWishlist } from "../hooks/useWishlist";

type Tab = "all" | "ai";

const TABS: { id: Tab; label: string; accent?: boolean }[] = [
  { id: "all", label: "All Saved" },
  { id: "ai", label: "✦ AI Picks", accent: true },
];

export default function Wishlist() {
  const { data: items, isLoading, isError } = useWishlist();
  const [tab, setTab] = useState<Tab>("all");

  if (isLoading) {
    return (
      <div className="max-w-[1280px] mx-auto px-4 lg:px-8 py-24 text-center">
        <p className="text-sm tracking-[0.1em] uppercase text-[#777]">Loading…</p>
      </div>
    );
  }

  if (isError || !items) {
    return (
      <div className="max-w-[1280px] mx-auto px-4 lg:px-8 py-24 text-center">
        <p className="text-sm text-[#D64045]">We couldn&apos;t load your wishlist.</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-[1280px] mx-auto px-4 lg:px-8 py-24 flex flex-col items-center gap-6">
        <h1 className="text-4xl font-['Playfair_Display'] text-[#1A1A1A]">Wishlist</h1>
        <p className="text-sm text-[#777]">
          Nothing saved yet — tap the heart on anything you like.
        </p>
        <Link
          to="/shop"
          className="h-[52px] px-8 bg-[#1A1A1A] text-white text-xs font-semibold tracking-[0.15em] uppercase hover:bg-[#333] transition-colors flex items-center"
        >
          Browse the Catalog
        </Link>
      </div>
    );
  }

  // Filtered in the browser, not by a request: the whole wishlist is already in
  // the cache, so a per-tab fetch would be a round-trip to hide rows we hold.
  const visible = tab === "ai" ? items.filter((i) => i.source === "ai") : items;

  return (
    <div className="max-w-[1280px] mx-auto px-4 lg:px-8 py-12 pb-24">
      <header className="border-b border-[#E5E5E5] pb-6">
        <h1 className="text-4xl lg:text-5xl font-['Playfair_Display'] text-[#1A1A1A] flex items-baseline gap-3">
          Wishlist
          <span className="text-base text-[#777]">
            ({items.length} item{items.length === 1 ? "" : "s"})
          </span>
        </h1>

        <div className="mt-8 flex gap-8">
          {TABS.map(({ id, label, accent }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              aria-pressed={tab === id}
              className={`pb-2 text-xs font-semibold tracking-[0.15em] uppercase transition-colors border-b-2 ${
                tab === id
                  ? "border-[#1A1A1A] text-[#1A1A1A]"
                  : `border-transparent hover:text-[#1A1A1A] ${
                      accent ? "text-[#6366F1]" : "text-[#777]"
                    }`
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </header>

      {visible.length === 0 ? (
        <div className="py-24 flex flex-col items-center gap-6">
          <p className="text-sm text-[#777]">
            No AI picks yet — save something the stylist suggests and it lands here.
          </p>
          <Link
            to="/chat"
            className="h-[52px] px-8 border border-[#6366F1] text-[#6366F1] text-xs font-semibold tracking-[0.15em] uppercase hover:bg-[#F5F5FF] transition-colors flex items-center"
          >
            ✦ Ask the AI Stylist
          </Link>
        </div>
      ) : (
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {visible.map((item) => (
            <WishlistCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
