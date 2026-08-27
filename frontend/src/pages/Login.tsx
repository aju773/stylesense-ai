import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import { useDocumentTitle } from "../hooks/useDocumentTitle";


export default function Login() {
  useDocumentTitle("Log In");
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const from = (location.state as { from?: string })?.from || "/";
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err: unknown) {
      if (
        err !== null &&
        typeof err === "object" &&
        "response" in err &&
        (err as { response?: { data?: { detail?: string } } }).response?.data
          ?.detail
      ) {
        setError(
          (err as { response: { data: { detail: string } } }).response.data
            .detail
        );
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6">
      <div className="w-full max-w-[400px]">
        <div className="mb-8">
          <h1 className="font-display text-4xl text-[#1A1A1A] mb-2">
            Welcome Back
          </h1>
          <p className="text-base text-[#777]">Sign in to your account</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded">
              {error}
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold tracking-[0.15em] text-[#1A1A1A] mb-2 uppercase">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              required
              className="w-full h-12 px-3 bg-[#F9F7F4] text-base text-[#1A1A1A] placeholder-[#AAA] outline-none border-b-2 border-transparent focus:border-[#1A1A1A] transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold tracking-[0.15em] text-[#1A1A1A] mb-2 uppercase">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full h-12 px-3 bg-[#F9F7F4] text-base text-[#1A1A1A] placeholder-[#AAA] outline-none border-b-2 border-transparent focus:border-[#1A1A1A] transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-12 bg-[#1A1A1A] text-white text-xs font-semibold tracking-[0.15em] uppercase hover:bg-[#313030] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? "Signing in..." : "Sign In"}
          </button>
        </form>
        <p className="text-center text-sm text-[#777] mt-8">
          Don't have an account?{" "}
          <Link to="/register" className="text-[#1A1A1A] font-semibold hover:underline">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
