import { useState } from "react";
import { Link } from "react-router";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { useMe, useUpdateMe } from "../hooks/useMe";
import type { User } from "../api/auth";

// Mirrors the closed vocabulary the server actually validates
// (backend/apps/users/serializers.py) — the server owns enforcement, this
// list only drives which chips render.
const VIBE_CHOICES = ["Minimalist", "Tailored", "Bohemian", "Streetwear", "Monochrome"] as const;
const SIZE_CHOICES = ["XS", "S", "M", "L", "XL", "XXL"] as const;
const GENDER_CHOICES = ["Women", "Men", "Unisex"] as const;

interface Budget {
  min?: number;
  max?: number;
}

interface BudgetBand {
  label: string;
  min?: number;
  max?: number;
}

// Bands are mutually exclusive by construction — the epic's "settle in
// implementation" note flags that neighbouring bands as drawn would overlap
// at their shared boundary; a dedicated "Any" chip (rather than letting two
// bands both claim "under ₹6,000") resolves it instead.
const BUDGET_BANDS: BudgetBand[] = [
  { label: "Any" },
  { label: "Under ₹3,000", max: 3000 },
  { label: "₹3,000 – ₹6,000", min: 3000, max: 6000 },
  { label: "₹6,000+", min: 6000 },
];

function sameBudget(band: BudgetBand, budget: Budget): boolean {
  return band.min === budget.min && band.max === budget.max;
}

interface ProfileForm {
  first_name: string;
  last_name: string;
  vibes: string[];
  size: string | null;
  gender: string | null;
  budget: Budget;
}

function formFromUser(user: User): ProfileForm {
  const prefs = user.style_preferences ?? {};
  return {
    first_name: user.first_name,
    last_name: user.last_name,
    vibes: prefs.vibes ?? [],
    size: prefs.size ?? null,
    gender: prefs.gender ?? null,
    budget: prefs.budget ?? {},
  };
}

function Chip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`border px-3.5 py-2 text-xs font-semibold tracking-[0.1em] uppercase transition-colors ${
        active
          ? "border-[#1A1A1A] bg-[#1A1A1A] text-white"
          : "border-[#E5E5E5] text-[#333] hover:border-[#1A1A1A]"
      }`}
    >
      {label}
    </button>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold tracking-[0.12em] uppercase text-[#777] mb-3">
      {children}
    </p>
  );
}

export default function Profile() {
  useDocumentTitle("Profile");
  const { data, isLoading, isError } = useMe();
  const updateMe = useUpdateMe();
  const [form, setForm] = useState<ProfileForm | null>(null);
  const [seededFor, setSeededFor] = useState<number | null>(null);

  // Seeds once per user, adjusted during render rather than in an effect
  // (react.dev's "adjusting state when data changes" pattern) — not on every
  // background refetch, so an in-progress edit is never clobbered.
  if (data && seededFor !== data.id) {
    setForm(formFromUser(data));
    setSeededFor(data.id);
  }

  if (isLoading || !form) {
    return (
      <div className="max-w-[1280px] mx-auto px-4 lg:px-8 py-24 text-center">
        <p className="text-sm tracking-[0.1em] uppercase text-[#777]">Loading…</p>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="max-w-[1280px] mx-auto px-4 lg:px-8 py-24 text-center">
        <p className="text-sm text-[#D64045]">We couldn&apos;t load your profile.</p>
      </div>
    );
  }

  const dirty = JSON.stringify(form) !== JSON.stringify(formFromUser(data));

  function set<K extends keyof ProfileForm>(key: K, value: ProfileForm[K]) {
    setForm((f) => f && { ...f, [key]: value });
  }

  function toggleVibe(vibe: string) {
    setForm(
      (f) =>
        f && {
          ...f,
          vibes: f.vibes.includes(vibe)
            ? f.vibes.filter((v) => v !== vibe)
            : [...f.vibes, vibe],
        }
    );
  }

  function handleSave() {
    if (!form) return;
    updateMe.mutate(
      {
        first_name: form.first_name,
        last_name: form.last_name,
        style_preferences: {
          vibes: form.vibes,
          size: form.size,
          gender: form.gender,
          budget: form.budget,
        },
      },
      { onSuccess: (user) => setForm(formFromUser(user)) }
    );
  }

  return (
    <div className="max-w-[820px] mx-auto px-4 lg:px-8 py-12 pb-16">
      <h1 className="font-display text-4xl text-[#1A1A1A] mb-10">My Account</h1>

      <div className="mb-10 border-l-2 border-[#6366F1] bg-[#F9F7F4] px-5 py-4">
        <p className="text-sm leading-relaxed text-[#333]">
          <span className="mr-1.5 text-[#6366F1]">✦</span>
          These preferences shape what the AI stylist searches for — it looks
          only at what you&apos;d actually shop for, and tells you when a pick
          falls outside your size or budget instead of hiding it.{" "}
          <Link to="/chat" className="underline underline-offset-4 hover:text-[#1A1A1A]">
            Open the stylist →
          </Link>
        </p>
      </div>

      <section className="mb-14">
        <h2 className="font-display text-2xl text-[#1A1A1A] mb-6">Your Style Profile</h2>

        <div className="space-y-8">
          <div>
            <Label>Aesthetic</Label>
            <div className="flex flex-wrap gap-2">
              {VIBE_CHOICES.map((vibe) => (
                <Chip
                  key={vibe}
                  label={vibe}
                  active={form.vibes.includes(vibe)}
                  onClick={() => toggleVibe(vibe)}
                />
              ))}
            </div>
          </div>

          <div className="grid gap-8 sm:grid-cols-2">
            <div>
              <Label>Size</Label>
              <div className="flex flex-wrap gap-2">
                {SIZE_CHOICES.map((size) => (
                  <Chip
                    key={size}
                    label={size}
                    active={form.size === size}
                    onClick={() => set("size", form.size === size ? null : size)}
                  />
                ))}
              </div>
            </div>
            <div>
              <Label>Shopping For</Label>
              <div className="flex flex-wrap gap-2">
                {GENDER_CHOICES.map((gender) => (
                  <Chip
                    key={gender}
                    label={gender}
                    active={form.gender === gender}
                    onClick={() => set("gender", form.gender === gender ? null : gender)}
                  />
                ))}
              </div>
            </div>
          </div>

          <div>
            <Label>Budget Per Item</Label>
            <div className="flex flex-wrap gap-2">
              {BUDGET_BANDS.map((band) => (
                <Chip
                  key={band.label}
                  label={band.label}
                  active={sameBudget(band, form.budget)}
                  onClick={() => set("budget", { min: band.min, max: band.max })}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      <details className="border-t border-[#E5E5E5] pt-8">
        <summary className="cursor-pointer text-xs font-semibold tracking-[0.12em] uppercase text-[#777] hover:text-[#1A1A1A] transition-colors">
          Personal Information
        </summary>
        <div className="pt-6 grid gap-4 sm:grid-cols-2 max-w-[520px]">
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold tracking-[0.1em] uppercase text-[#777]">
              First name
            </span>
            <input
              value={form.first_name}
              onChange={(e) => set("first_name", e.target.value)}
              className="w-full border border-[#E5E5E5] px-3 py-2.5 text-sm text-[#1A1A1A] outline-none focus:border-[#1A1A1A] transition-colors"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold tracking-[0.1em] uppercase text-[#777]">
              Last name
            </span>
            <input
              value={form.last_name}
              onChange={(e) => set("last_name", e.target.value)}
              className="w-full border border-[#E5E5E5] px-3 py-2.5 text-sm text-[#1A1A1A] outline-none focus:border-[#1A1A1A] transition-colors"
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="mb-1.5 block text-xs font-semibold tracking-[0.1em] uppercase text-[#777]">
              Email address
            </span>
            <input
              value={data.email}
              disabled
              className="w-full border border-transparent bg-[#F5F5F5] px-3 py-2.5 text-sm text-[#777] outline-none"
            />
            <span className="mt-1.5 block text-xs text-[#AAA]">
              Your email is how you sign in and can&apos;t be changed here.
            </span>
          </label>
        </div>
      </details>

      {dirty && (
        <div className="sticky bottom-0 mt-10 -mx-4 lg:-mx-8 border-t border-[#E5E5E5] bg-white/95 backdrop-blur-sm px-4 lg:px-8 py-4 flex items-center gap-4 z-10">
          <button
            type="button"
            onClick={handleSave}
            disabled={updateMe.isPending}
            className="h-12 px-8 bg-[#1A1A1A] text-white text-xs font-semibold tracking-[0.15em] uppercase hover:bg-[#333] transition-colors disabled:opacity-50"
          >
            {updateMe.isPending ? "Saving…" : "Save Changes"}
          </button>
          <span className="text-xs text-[#777]">You have unsaved changes.</span>
          {updateMe.isError && (
            <span className="text-xs text-[#D64045]">Something went wrong — try again.</span>
          )}
        </div>
      )}
    </div>
  );
}
