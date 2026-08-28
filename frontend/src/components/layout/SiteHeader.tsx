import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router";
import { useAuth } from "../../context/AuthContext";
import { useCartUI } from "../../context/CartUIContext";
import { useCartCount } from "../../hooks/useCart";
import { useWishlistCount } from "../../hooks/useWishlist";

const NAV_LINKS = [
  { to: "/", label: "Home", end: true },
  { to: "/shop", label: "Shop" },
];

/** Wordmark row collapses once the page has scrolled past its own height. */
const RETRACT_THRESHOLD = 80;

function SearchIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 21s-7.5-4.6-10-9.3C.4 8.4 2 5 5.5 5c2 0 3.5 1.1 4.5 2.6C11 6.1 12.5 5 14.5 5 18 5 19.6 8.4 22 11.7 19.5 16.4 12 21 12 21z" />
    </svg>
  );
}

function BagIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
      <path d="M3 6h18" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  );
}

function PersonIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c1.5-4.5 5-6 8-6s6.5 1.5 8 6" />
    </svg>
  );
}

const navClass = ({ isActive }: { isActive: boolean }) =>
  `text-xs font-semibold tracking-[0.15em] uppercase transition-colors ${
    isActive ? "text-[#1A1A1A]" : "text-[#777] hover:text-[#1A1A1A]"
  }`;

function NavRow() {
  return (
    <nav className="flex items-center justify-center gap-8 h-12 border-t border-[#E5E5E5]">
      {NAV_LINKS.map((link) => (
        <NavLink key={link.to} to={link.to} end={link.end} className={navClass}>
          {link.label}
        </NavLink>
      ))}
      <NavLink
        to="/chat"
        className={({ isActive }) =>
          `text-xs font-semibold tracking-[0.15em] uppercase transition-colors flex items-center gap-1.5 ${
            isActive ? "text-[#4F46E5]" : "text-[#6366F1] hover:text-[#4F46E5]"
          }`
        }
      >
        ✦ AI Stylist
      </NavLink>
    </nav>
  );
}

/**
 * The header's first exposure of the `search` filter param — `ProductFilters`,
 * `FILTER_KEYS`, and the API's name+description `icontains` already exist,
 * nothing has ever surfaced a control for it. Expands inline rather than as a
 * fixed overlay: the header already establishes a `backdrop-filter` containing
 * block, which would otherwise mis-position a `position: fixed` dropdown.
 */
function HeaderSearch() {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const query = value.trim();
    if (!query) {
      setOpen(false);
      return;
    }
    navigate(`/shop?search=${encodeURIComponent(query)}`);
    setValue("");
    setOpen(false);
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Search products"
        className="w-9 h-9 flex items-center justify-center text-[#1A1A1A] hover:bg-[#F9F7F4] rounded-full transition-colors"
      >
        <SearchIcon />
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="flex items-center gap-2 max-w-[240px]">
      <SearchIcon />
      <input
        ref={inputRef}
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={() => {
          if (!value.trim()) setOpen(false);
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape") setOpen(false);
        }}
        placeholder="Search products…"
        aria-label="Search products"
        className="w-full bg-transparent border-b border-[#1A1A1A] text-sm text-[#1A1A1A] placeholder:text-[#AAA] outline-none py-1"
      />
    </form>
  );
}

export default function SiteHeader() {
  const { isAuthenticated, logout } = useAuth();
  const { openDrawer } = useCartUI();
  const cartCount = useCartCount();
  const wishlistCount = useWishlistCount();
  const [scrolled, setScrolled] = useState(false);
  const { pathname } = useLocation();
  // /shop stacks a second sticky bar (the filter bar) right below the header.
  // Elsewhere the wordmark row retracting and the nav row staying put is the
  // whole story; on /shop the nav row retracts too, so the filter bar can
  // take the sticky slot alone instead of ~100px of stacked chrome.
  const onShop = pathname === "/shop";

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > RETRACT_THRESHOLD);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-[#E5E5E5]">
      <div className="max-w-[1280px] mx-auto px-4 lg:px-8">
        <div
          className={`overflow-hidden transition-[max-height,opacity] duration-300 ease-in-out ${
            scrolled ? "max-h-0 opacity-0" : "max-h-24 opacity-100"
          }`}
        >
          <div className="h-20 flex items-center justify-between gap-4">
            <div className="flex-1 flex items-center">
              <HeaderSearch />
            </div>

            <Link
              to="/"
              className="flex-none text-lg font-display tracking-tight uppercase text-[#1A1A1A]"
            >
              StyleSense AI
            </Link>

            <div className="flex-1 flex items-center justify-end gap-4">
              {isAuthenticated && (
                <Link
                  to="/wishlist"
                  aria-label={`Wishlist, ${wishlistCount} item${wishlistCount === 1 ? "" : "s"}`}
                  className="relative w-9 h-9 flex items-center justify-center text-[#1A1A1A] hover:bg-[#F9F7F4] rounded-full transition-colors"
                >
                  <HeartIcon />
                  {wishlistCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#1A1A1A] text-white text-[10px] font-semibold flex items-center justify-center tabular-nums">
                      {wishlistCount > 99 ? "99+" : wishlistCount}
                    </span>
                  )}
                </Link>
              )}

              <button
                type="button"
                onClick={openDrawer}
                aria-label={`Open bag, ${cartCount} item${cartCount === 1 ? "" : "s"}`}
                className="relative w-9 h-9 flex items-center justify-center text-[#1A1A1A] hover:bg-[#F9F7F4] rounded-full transition-colors"
              >
                <BagIcon />
                {cartCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#1A1A1A] text-white text-[10px] font-semibold flex items-center justify-center tabular-nums">
                    {cartCount > 99 ? "99+" : cartCount}
                  </span>
                )}
              </button>

              {isAuthenticated ? (
                <>
                  <Link
                    to="/profile"
                    aria-label="Account"
                    className="w-8 h-8 rounded-full bg-[#1A1A1A] flex items-center justify-center text-white hover:opacity-80 transition-opacity"
                  >
                    <PersonIcon />
                  </Link>
                  <button
                    type="button"
                    onClick={() => logout()}
                    className="text-xs font-semibold tracking-[0.15em] uppercase text-[#777] hover:text-[#1A1A1A] transition-colors"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  className="text-xs font-semibold tracking-[0.15em] uppercase text-[#777] hover:text-[#1A1A1A] transition-colors"
                >
                  Login
                </Link>
              )}
            </div>
          </div>
        </div>

        <div
          className={`overflow-hidden transition-[max-height,opacity] duration-300 ease-in-out ${
            onShop && scrolled ? "max-h-0 opacity-0" : "max-h-16 opacity-100"
          }`}
        >
          <NavRow />
        </div>
      </div>
    </header>
  );
}
