import { BrowserRouter, Routes, Route } from "react-router";
import { AuthProvider } from "./context/AuthContext";
import { CartUIProvider } from "./context/CartUIContext";
import AppLayout from "./components/layout/AppLayout";
import ProtectedRoute from "./components/common/ProtectedRoute";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Chat from "./pages/Chat";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Orders from "./pages/Orders";
import Wishlist from "./pages/Wishlist";
import Profile from "./pages/Profile";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartUIProvider>
          <Routes>
            {/* Login and register are deliberately outside AppLayout — they are
                full-bleed pages with no header, and the cart chrome would be
                noise on a page you cannot yet have a cart from. */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route element={<AppLayout />}>
              {/* Public routes */}
              <Route path="/" element={<Home />} />
              <Route path="/shop" element={<Products />} />
              <Route path="/products/:slug" element={<ProductDetail />} />
              {/* Protected routes */}
              <Route element={<ProtectedRoute />}>
                <Route path="/chat" element={<Chat />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/wishlist" element={<Wishlist />} />
                <Route path="/orders" element={<Orders />} />
                <Route path="/profile" element={<Profile />} />
              </Route>
            </Route>
          </Routes>
        </CartUIProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
