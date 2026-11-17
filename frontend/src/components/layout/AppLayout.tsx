import { Outlet, useLocation } from "react-router";
import CartDrawer from "../cart/CartDrawer";
import SiteHeader from "./SiteHeader";
import Footer from "./Footer";

const NO_FOOTER_PATHS = ["/chat", "/checkout"];

const FIXED_HEIGHT_PATHS = ["/chat"];

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
