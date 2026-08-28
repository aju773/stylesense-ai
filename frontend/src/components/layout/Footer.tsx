import { Link } from "react-router";

const SHOPPING_LINKS = [
  { to: "/shop", label: "Shop All" },
  { to: "/shop?gender=Women", label: "For Her" },
  { to: "/shop?gender=Men", label: "For Him" },
  { to: "/shop?gender=Unisex", label: "Unisex" },
];

const ACCOUNT_LINKS = [
  { to: "/chat", label: "AI Stylist" },
  { to: "/wishlist", label: "Wishlist" },
  { to: "/orders", label: "My Orders" },
  { to: "/profile", label: "My Account" },
];

/**
 * Every tile lands on a real destination — no Support column (no shipping
 * page, style guide, or contact form to link to) and no newsletter field (no
 * endpoint, no model, no email service behind it).
 */
export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-[#1A1A1A] text-white">
      <div className="max-w-[1280px] mx-auto px-4 lg:px-8 py-16 grid grid-cols-1 md:grid-cols-3 gap-10">
        <div>
          <h4 className="font-display text-lg uppercase tracking-tight mb-4">
            StyleSense AI
          </h4>
          <p className="text-sm text-[#AAA] leading-relaxed max-w-[320px]">
            The intersection of curated elegance and artificial intelligence.
            Personalized styling for the modern wardrobe.
          </p>
        </div>

        <div>
          <h5 className="text-xs font-semibold tracking-[0.15em] uppercase text-[#777] mb-4">
            Shopping
          </h5>
          <ul className="space-y-2.5 text-sm text-[#CCC]">
            {SHOPPING_LINKS.map((link) => (
              <li key={link.label}>
                <Link to={link.to} className="hover:text-white transition-colors">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h5 className="text-xs font-semibold tracking-[0.15em] uppercase text-[#777] mb-4">
            Account
          </h5>
          <ul className="space-y-2.5 text-sm text-[#CCC]">
            {ACCOUNT_LINKS.map((link) => (
              <li key={link.label}>
                <Link to={link.to} className="hover:text-white transition-colors">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="max-w-[1280px] mx-auto px-4 lg:px-8 py-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[#777]">
        <span>&copy; {year} StyleSense AI. All rights reserved.</span>
        <span>Photography from Unsplash.</span>
      </div>
    </footer>
  );
}
