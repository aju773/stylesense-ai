import { Outlet, useLocation } from "react-router";
import CartDrawer from "../cart/CartDrawer";
import SiteHeader from "./SiteHeader";
import Footer from "./Footer";

const NO_FOOTER_PATHS = ["/chat", "/checkout"];

/**
 * Global chrome, applied as a layout route. The drawer lives here rather than
 * in the header so it renders above page content on every route and survives
 * navigation between them.
 */
export default function AppLayout() {
  const { pathname } = useLocation();
  const showFooter = !NO_FOOTER_PATHS.includes(pathname);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <SiteHeader />
      <div className="flex-1">
        <Outlet />
      </div>
      {showFooter && <Footer />}
      <CartDrawer />
    </div>
  );
}
