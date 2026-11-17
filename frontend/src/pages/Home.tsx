import { Link } from "react-router";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { useProducts } from "../hooks/useProducts";
import ProductCard from "../components/products/ProductCard";
import ProductPhoto from "../components/common/ProductPhoto";
import { HOME_HERO_IMAGE, HOME_EDIT_TILES } from "../lib/homeImagery";

function SparkleIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18" />
    </svg>
  );
}

function ArrowIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M5 12h14M13 5l7 7-7 7" />
    </svg>
  );
}

function BubbleIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="w-8 h-8">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
      <path d="M8 10h.01M12 10h.01M16 10h.01" />
    </svg>
  );
}

function TuneIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="w-8 h-8">
      <path d="M4 6h9M17 6h3M4 12h3M11 12h9M4 18h13M21 18h-1" />
      <circle cx="13" cy="6" r="2" />
      <circle cx="7" cy="12" r="2" />
      <circle cx="19" cy="18" r="2" />
    </svg>
  );
}

function BagPlusIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="w-8 h-8">
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
      <path d="M3 6h18" />
      <path d="M16 10a4 4 0 0 1-8 0" />
      <path d="M12 13v4M10 15h4" />
    </svg>
  );
}

function TruckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="w-6 h-6">
      <path d="M3 16V6a1 1 0 0 1 1-1h9v11" />
      <path d="M13 9h4l4 4v3h-2" />
      <circle cx="7.5" cy="18" r="1.75" />
      <circle cx="17.5" cy="18" r="1.75" />
      <path d="M5.75 18h1M19.25 18h1M9.25 18h6.5" />
    </svg>
  );
}

function PackageIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="w-6 h-6">
      <path d="m21 8-9-5-9 5 9 5 9-5z" />
      <path d="M3 8v8l9 5 9-5V8" />
      <path d="M12 13v8" />
    </svg>
  );
}

function CompareIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="w-6 h-6">
      <path d="M9 3v18M9 6H3v12h6M15 21V3M15 18h6V6h-6" />
    </svg>
  );
}

const AI_CARDS = [
  {
    icon: BubbleIcon,
    title: "A Reason For Every Pick",
    body: "Every suggestion comes with a plain-language rationale, not just a photo — you'll always know why the stylist chose it.",
  },
  {
    icon: TuneIcon,
    title: "Styled To Your Taste",
    body: "Set your colour, fit, and brand preferences once in your profile — every conversation styles around them from then on.",
  },
  {
    icon: BagPlusIcon,
    title: "Add To Bag Mid-Chat",
    body: "Like a pick? Add it to your bag right inside the conversation — no tab-switching to the catalog required.",
  },
];

const EDIT_TILES = [
  { ...HOME_EDIT_TILES[0], label: "For Her", gender: "Women" },
  { ...HOME_EDIT_TILES[1], label: "For Him", gender: "Men" },
  { ...HOME_EDIT_TILES[2], label: "Unisex", gender: "Unisex" },
];

const TRUST_ITEMS = [
  { Icon: TruckIcon, label: "Free Shipping", accent: false },
  { Icon: SparkleIcon, label: "AI Styling", accent: true },
  { Icon: PackageIcon, label: "Order Tracking", accent: false },
  { Icon: CompareIcon, label: "Save & Compare", accent: false },
];

export default function Home() {
  useDocumentTitle();
  const { data } = useProducts();
  const trending = data?.pages[0]?.results.slice(0, 4) ?? [];

  return (
    <div>
      <section className="max-w-[1280px] mx-auto px-4 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-8 py-16 lg:py-24 items-center">
        <div className="flex flex-col items-start gap-6">
          <div className="flex items-center gap-2 text-[#6366F1] text-xs font-semibold tracking-[0.15em] uppercase">
            <SparkleIcon className="w-4 h-4" />
            AI-Powered Fashion
          </div>
          <h1 className="font-display text-4xl lg:text-6xl leading-[1.1] text-[#1A1A1A] max-w-lg">
            Discover Your Perfect Style
          </h1>
          <p className="text-lg text-[#777] leading-relaxed max-w-md">
            The intersection of curated elegance and artificial intelligence.
            Personalized styling that understands your unique aesthetic.
          </p>
          <div className="flex flex-wrap gap-4 mt-2">
            <Link
              to="/chat"
              className="h-[52px] px-8 bg-[#1A1A1A] text-white text-xs font-semibold tracking-[0.15em] uppercase hover:bg-[#333] transition-colors flex items-center"
            >
              Chat With AI Stylist
            </Link>
            <Link
              to="/shop"
              className="h-[52px] px-8 border border-[#1A1A1A] text-[#1A1A1A] text-xs font-semibold tracking-[0.15em] uppercase hover:bg-[#F9F7F4] transition-colors flex items-center"
            >
              Browse Collection
            </Link>
          </div>
        </div>
        <div className="relative w-full aspect-[4/3] lg:aspect-auto lg:h-[600px] overflow-hidden rounded-sm">
          <ProductPhoto
            src={HOME_HERO_IMAGE}
            alt="Editorial fashion photography"
            className="w-full h-full"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
        </div>
      </section>

      <section className="bg-[#F9F7F4] py-16 lg:py-24">
        <div className="max-w-[1280px] mx-auto px-4 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl lg:text-4xl text-[#1A1A1A] mb-3">
              Your Personal AI Stylist
            </h2>
            <p className="text-[#777] max-w-2xl mx-auto">
              A stylist that explains itself, remembers your taste, and lets
              you shop without ever leaving the conversation.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {AI_CARDS.map(({ icon: Icon, title, body }) => (
              <div
                key={title}
                className="flex flex-col items-center text-center gap-4 bg-white p-8 rounded-sm shadow-sm hover:-translate-y-1 transition-transform"
              >
                <div className="w-16 h-16 rounded-full bg-[#6366F1]/10 text-[#6366F1] flex items-center justify-center">
                  <Icon />
                </div>
                <h3 className="text-lg font-semibold text-[#1A1A1A]">{title}</h3>
                <p className="text-sm text-[#777] leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-[1280px] mx-auto px-4 lg:px-8 py-16 lg:py-24">
        <div className="flex justify-between items-end mb-8 border-b border-[#E5E5E5] pb-4">
          <div>
            <span className="text-xs font-semibold tracking-[0.15em] uppercase text-[#777] block mb-1">
              Curated Edit
            </span>
            <h2 className="font-display text-3xl lg:text-4xl text-[#1A1A1A]">
              Trending Now
            </h2>
          </div>
          <Link
            to="/shop?ordering=recommended"
            className="text-xs font-semibold tracking-[0.15em] uppercase text-[#1A1A1A] hover:text-[#777] transition-colors flex items-center gap-1.5 whitespace-nowrap"
          >
            View All <ArrowIcon className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {trending.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      <section className="max-w-[1280px] mx-auto px-4 lg:px-8 py-16 lg:py-24">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {EDIT_TILES.map(({ image, label, gender }) => (
            <Link
              key={gender}
              to={`/shop?gender=${gender}`}
              className="group relative aspect-[4/5] overflow-hidden rounded-sm"
            >
              <ProductPhoto
                src={image}
                alt={label}
                className="w-full h-full transition-transform duration-1000 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-colors duration-500" />
              <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end">
                <div className="text-white">
                  <span className="text-xs font-semibold tracking-[0.15em] uppercase opacity-80 block mb-1">
                    The Edit
                  </span>
                  <h3 className="font-display text-2xl">{label}</h3>
                </div>
                <ArrowIcon className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all duration-300" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="max-w-[1280px] mx-auto px-4 lg:px-8 py-12 border-t border-[#E5E5E5]">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {TRUST_ITEMS.map(({ Icon, label, accent }) => (
            <div key={label} className="flex items-center gap-3">
              <span className={accent ? "text-[#6366F1]" : "text-[#777]"}>
                <Icon />
              </span>
              <span className="text-xs font-semibold tracking-[0.1em] uppercase text-[#777]">
                {label}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
