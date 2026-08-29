import { Outlet, useLocation } from "react-router";
import CartDrawer from "../cart/CartDrawer";
import SiteHeader from "./SiteHeader";
import Footer from "./Footer";

const NO_FOOTER_PATHS = ["/chat", "/checkout"];

// /chat is an app-shell pane, not a document: it must fit exactly below the
// header and scroll internally (its own message list), never the window. A
// plain min-h-screen page lets Outlet grow to its tallest child's content
// height, which is what let Chat's own h-screen add a full viewport ON TOP
// OF the header instead of fitting inside what's left of one.
const FIXED_HEIGHT_PATHS = ["/chat"];

/**
 * Global chrome, applied as a layout route. The drawer lives here rather than
 * in the header so it renders above page content on every route and survives
 * navigation between them.
 */
export default function AppLayout() {
  const { pathname } = useLocation();
  const showFooter = !NO_FOOTER_PATHS.includes(pathname);
  const fixedHeight = FIXED_HEIGHT_PATHS.includes(pathname);

  return (
    <div
      className={`bg-white flex flex-col ${fixedHeight ? "h-dvh" : "min-h-screen"}`}
    >
      <SiteHeader />
      <div
        className={`flex-1 flex flex-col min-h-0 ${fixedHeight ? "overflow-hidden" : ""}`}
      >
        <Outlet />
      </div>
      {showFooter && <Footer />}
      <CartDrawer />
    </div>
  );
}
