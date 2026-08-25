# 05 — Design foundation: fonts, tokens, footer, page title

Type: grilling
Status: resolved
Blocked by: 02

## Question

What exactly changes in the app's foundation layer, before any surface is
prototyped?

Decide, using the research from ticket 02:

- **Font loading.** Which faces load (Playfair Display for display type, and
  whichever body face `designs/design-system/DESIGN.md` specifies), by which
  mechanism, with what `font-display` strategy and preload hints. Decide whether
  the 28 existing `font-['Playfair_Display']` call sites are left working as-is
  or migrated to a registered `font-*` utility — and if migrated, whether that
  happens in this effort or is deferred.
- **Token set.** `DESIGN.md` defines roughly 60 colour tokens plus a typography
  scale. The app hardcodes `#1A1A1A`, `#F9F7F4`, `#777`, and `#E5E5E5` inline
  everywhere, and `#1A1A1A` does not appear in the token file at all. Decide
  which tokens enter `@theme` now, how the mismatch between the app's real
  palette and `DESIGN.md` is reconciled, and which document becomes canonical.
- **Footer.** Content, which routes it appears on, and where its links point
  given that `COLLECTIONS` and `ABOUT` are out of scope. Both the home and shop
  designs draw a four-column footer with a newsletter field; decide whether the
  newsletter input ships as a real control or is cut.
- **Header.** `SiteHeader.tsx` renders a single row with Home and Shop plus
  authenticated links. Both design files draw a two-row header: a centred
  wordmark with search, wishlist, bag, and account icons above, and a nav row
  below. Decide the final nav shape, where the AI Stylist entry point sits, and
  whether a search affordance appears in the header now that the shop gains a
  filter bar.
- **Document head.** Page title (currently `frontend`), favicon, and whether
  per-route titles are in scope.

This ticket blocks every surface prototype. Nothing downstream should be
designed against a fallback typeface.

## Answer

Seven decisions. Research backing: [`docs/research-tailwind-v4-theme-fonts.md`](../../../docs/research-tailwind-v4-theme-fonts.md).

### 1. Canonical palette — the 12-colour semantic set

`designs/design-system/DESIGN.md` carries **two conflicting palettes**: a
~60-token Material-3 set in the YAML frontmatter (`surface-container-highest`,
`on-primary-fixed-variant`, primary `#000000`) and a 12-colour semantic set in
the markdown body (Primary Black `#1A1A1A`, Text Dark, Text Muted, Border,
Background Cream, and so on).

The app already implements the markdown set exactly — 156 uses of `#1A1A1A`, 73
of `#777`, 30 of `#E5E5E5`, 24 of `#F9F7F4`. The frontmatter set is generator
output that was never wired to anything.

**The markdown palette is canonical.** The frontmatter palette stays unwired.
Adopting this is recognising what the app already is, not migrating to it. The
alternative would repaint nine working pages for no user-visible gain.

`#C9A96E` ("Accent Warm", the gold) is defined in that palette and used zero
times. It enters `@theme` as a token regardless; whether any surface spends it
is a decision for tickets 06, 08, and 09, not this one.

### 2. `@theme` scope — colours, fonts, type scale

The block carries the 12 colour tokens, the two font families, and the type
scale (`h1`–`h4`, `body-lg`–`body-xs`, `label-caps`).

Excluded: spacing (Tailwind's default is already a 4px base matching DESIGN.md's
grid), radii, shadows, and transitions. Not because they don't belong, but
because in Tailwind v4 a `@theme` token **overrides the default when the name
collides** — declaring `--radius-lg` or `--shadow-md` silently restyles every
`rounded-lg` and `shadow-md` across nine built pages. That restyle is the
hardcoded-hex refactor this effort already ruled out of scope.

The type scale is safe by naming: `--text-h1`, `--text-body-lg`,
`--text-label-caps` collide with none of Tailwind's `--text-sm` / `--text-4xl`.
So this scope is fully additive.

### 3. Font loading — self-host, and override `--font-sans`

Both faces self-hosted via Fontsource variable packages
(`@fontsource-variable/playfair-display`, `@fontsource-variable/inter`),
imported above `@import "tailwindcss";` in `frontend/src/index.css`.

Note the naming trap, verified against the published package CSS: the variable
builds register as `"Playfair Display Variable"` and `"Inter Variable"`, **not**
the bare family names.

- **Playfair** → `--font-display`. All 28 `font-['Playfair_Display']` call sites
  across 17 files migrate to `font-display`.
- **Inter** → overrides Tailwind's own `--font-sans` token.

That second choice is the highest-leverage line in the ticket. Inter has **zero**
call sites today — no `font-['Inter']` anywhere — so every unstyled paragraph in
the app renders in the system UI stack. Registering Inter as a new `font-body`
utility would change nothing on screen until someone touched hundreds of
elements. Overriding `--font-sans` makes every existing element inherit Inter
with no edits at all.

Root cause of the original bug, confirmed: Tailwind never loads font files — not
for arbitrary values, not for `@theme` tokens. `font-['Playfair_Display']`
compiles to valid, warning-free CSS and falls straight through to the browser
default.

### 4. Header — two rows, top row retracts on scroll

Row 1: search icon, centred wordmark, then wishlist / bag / account icons.
Row 2: centred nav — `HOME · SHOP · AI STYLIST`. `COLLECTIONS` and `ABOUT` are
out of scope and do not appear. The account icon points at `/profile`, which
became a real destination when Profile entered scope.

On scroll the wordmark row retracts and the nav row stays sticky. This settles
the split between the centred-wordmark composition (the editorial-luxury
signature) and the cost of ~112px of permanently sticky chrome on a site built
around photographs. Branding only needs to land once.

The header search icon becomes the first UI for the **`search`** filter param,
which the API already implements as a name+description `icontains` and which
`FILTER_KEYS` already lists — no surface has ever exposed it.

### 5. Footer — real destinations only

Three columns plus a copyright rule: brand blurb, a Shopping column whose links
are filtered `/shop` queries, and an Account / AI Stylist column.

Cut from the design: the **Support** column (no shipping page, no style guide,
no contact form, and no route for any of them) and the **Newsletter** field (no
endpoint, no model, no email service — a field that swallows an address and says
nothing is worse than no field). Both fail the map's standing rule that every
tile must land on a real destination.

Copyright year is dynamic, not the design's hardcoded `© 2024`.

### 6. Footer placement — everywhere except chat and checkout

The footer renders in `AppLayout` on every route it wraps, minus `/chat` and
`/checkout`. Chat is a full-height conversation with its own sidebar and a
pinned input; checkout is a payment funnel where every outbound link is a leak.
Login and Register already sit outside `AppLayout`.

The design only draws a footer on Home and Shop, but that would leave Cart,
Orders, Wishlist, and Product Detail ending in raw whitespace.

### 7. Document head — per-route titles and a real favicon

`index.html` still carries `<title>frontend</title>`, the Vite scaffold title,
and `public/favicon.svg` is a purple lightning bolt (`#863bff`) belonging to no
palette in this project.

Both are replaced. Per-route titles come from a small `useDocumentTitle` hook —
React Router v8 is running in declarative mode, so there is no route `meta`
export and no head library is worth the dependency for ten lines.

Open Graph and social-preview tags are **not** in this ticket: the OG image is an
asset, and which asset depends on ticket 04's imagery decision. Recorded as fog
on the map.
