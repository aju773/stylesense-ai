import { BrowserRouter, Routes, Route } from "react-router";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/common/ProtectedRoute";
import Login from "./pages/Login";
import Register from "./pages/Register"
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Chat from "./pages/Chat";

// Placeholder pages — we'll build real ones in 2.4 and later tickets
function Home() {
  return <h1>Home</h1>;
}
function Cart() {
  return <h1>Cart (Protected)</h1>;
}
function Wishlist() {
  return <h1>Wishlist (Protected)</h1>;
}
function Orders() {
  return <h1>Orders (Protected)</h1>;
}
function Profile() {
  return <h1>Profile (Protected)</h1>;
}
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Home />} />
          <Route path="/shop" element={<Products />} />
          <Route path="/products/:slug" element={<ProductDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          {/* Protected routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/chat" element={<Chat />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/wishlist" element={<Wishlist />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/profile" element={<Profile />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
