import { Outlet } from "react-router";
import CartDrawer from "../cart/CartDrawer";
import SiteHeader from "./SiteHeader";

/**
 * Global chrome, applied as a layout route. The drawer lives here rather than
 * in the header so it renders above page content on every route and survives
 * navigation between them.
 */
export default function AppLayout() {
  return (
    <div className="min-h-screen bg-white">
      <SiteHeader />
      <Outlet />
      <CartDrawer />
    </div>
  );
}
