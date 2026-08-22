import { Link, NavLink } from "react-router";
import { useAuth } from "../../context/AuthContext";
import { useCartUI } from "../../context/CartUIContext";
import { useCartCount } from "../../hooks/useCart";

const NAV_LINKS = [
  { to: "/", label: "Home", end: true },
  { to: "/shop", label: "Shop" },
];

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

const navClass = ({ isActive }: { isActive: boolean }) =>
  `text-xs font-semibold tracking-[0.15em] uppercase transition-colors ${
    isActive ? "text-[#1A1A1A]" : "text-[#777] hover:text-[#1A1A1A]"
  }`;

/**
 * Rendered twice: inline beside the logo on desktop, and as its own row below
 * it on mobile — where there is no space for it inline, and hiding it outright
 * would leave small screens with no navigation at all.
 */
function NavLinks({
  className,
  isAuthenticated,
}: {
  className: string;
  isAuthenticated: boolean;
}) {
  return (
    <nav className={className}>
      {NAV_LINKS.map((link) => (
        <NavLink key={link.to} to={link.to} end={link.end} className={navClass}>
          {link.label}
        </NavLink>
      ))}
      {/* Orders is the only account page that exists yet — Wishlist and Profile
          are still stubs. A single link is honest; an account menu can come
          when there is more than one real thing to put in it. */}
      {isAuthenticated && (
        <NavLink to="/orders" className={navClass}>
          Orders
        </NavLink>
      )}
      <NavLink
        to="/chat"
        className={({ isActive }) =>
          `text-xs font-semibold tracking-[0.15em] uppercase transition-colors ${
            isActive ? "text-[#4F46E5]" : "text-[#6366F1] hover:text-[#4F46E5]"
          }`
        }
      >
        ✦ AI Stylist
      </NavLink>
    </nav>
  );
}

export default function SiteHeader() {
  const { isAuthenticated, logout } = useAuth();
  const { openDrawer } = useCartUI();
  const cartCount = useCartCount();

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-[#E5E5E5]">
      <div className="max-w-[1280px] mx-auto px-4 lg:px-8">
        <div className="h-16 flex items-center justify-between gap-4">
          <Link
            to="/"
            className="text-lg font-['Playfair_Display'] tracking-tight uppercase text-[#1A1A1A]"
          >
            StyleSense AI
          </Link>

          <NavLinks
            className="hidden sm:flex items-center gap-8"
            isAuthenticated={isAuthenticated}
          />

          <div className="flex items-center gap-4">
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
              <button
                type="button"
                onClick={() => logout()}
                className="text-xs font-semibold tracking-[0.15em] uppercase text-[#777] hover:text-[#1A1A1A] transition-colors"
              >
                Logout
              </button>
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

        <NavLinks
          className="sm:hidden flex items-center justify-center gap-6 h-11 border-t border-[#E5E5E5]"
          isAuthenticated={isAuthenticated}
        />
      </div>
    </header>
  );
}
