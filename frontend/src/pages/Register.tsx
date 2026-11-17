import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
export default function Register() {
  useDocumentTitle("Create Account");
  const { register } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  function validate(): string | null {
    if (password.length < 8) {
      return "Password must be at least 8 characters.";
    }
    if (password !== confirmPassword) {
      return "Passwords do not match.";
    }
    return null;
  }
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setIsSubmitting(true);
    try {
      await register(email, password);
      navigate("/", { replace: true });
    } catch (err: unknown) {
      if (
        err !== null &&
        typeof err === "object" &&
        "response" in err
      ) {
        const data = (err as { response: { data: Record<string, unknown> } })
          .response.data;
        const messages = Object.values(data)
          .flat()
          .join(" ");
        setError(messages || "Registration failed.");
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
            Create Account
          </h1>
          <p className="text-base text-[#777]">
            Join StyleSense AI for personalized fashion
          </p>
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
            <p className="text-xs text-[#AAA] mt-1">
              8+ characters, uppercase, number
            </p>
          </div>
          <div>
            <label className="block text-xs font-semibold tracking-[0.15em] text-[#1A1A1A] mb-2 uppercase">
              Confirm Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
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
            {isSubmitting ? "Creating account..." : "Create Account"}
          </button>
        </form>
        <p className="text-center text-sm text-[#777] mt-8">
          Already have an account?{" "}
          <Link to="/login" className="text-[#1A1A1A] font-semibold hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
