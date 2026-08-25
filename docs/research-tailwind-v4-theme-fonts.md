# Research: Tailwind CSS v4 `@theme`, custom fonts, and design tokens

> Scope: answers `.scratch/beautiful-stylesense/issues/02-tailwind-v4-fonts-tokens.md`.
> Method: primary sources only — official Tailwind CSS v4 docs, the `@tailwindcss/vite`
> install docs, Fontsource's own docs/package output, MDN, and Google's own font CSS
> endpoint (fetched directly, not summarized secondhand). Every claim below is cited.
> Repo facts (package.json, index.css, index.html, grep results, DESIGN.md,
> decision_log.md) were verified directly in this repo before writing this doc.

## Repo state verified before researching

- `frontend/package.json`: `"tailwindcss": "^4.3.3"`, `"@tailwindcss/vite": "^4.3.3"` —
  Tailwind v4 via the official Vite plugin, confirmed.
- `frontend/vite.config.ts` registers `tailwindcss()` from `@tailwindcss/vite` as a Vite
  plugin. No `tailwind.config.js`/`.ts` exists anywhere under `frontend/`.
- `frontend/src/index.css` is exactly one line: `@import "tailwindcss";`. No `@theme`
  block, no font `@import`/`@font-face`.
- `frontend/index.html` has no `<link>` to any font, no `preconnect`.
- `docs/modern_frontend_tooling.md:10` confirms the project's intent: *"CSS-First
  Configuration: The mandatory `tailwind.config.js` is removed. You now define your
  design tokens (colors, fonts, spacing, etc.) directly in your CSS file using the
  `@theme` directive."* — i.e. `@theme` in `index.css` is the intended (but not yet
  built) home for tokens, not `:root` and not a config file.
- `grep -rn "Playfair" frontend/src` → **28 matches across 17 files**, all of the form
  `font-['Playfair_Display']` (Tailwind's arbitrary-value syntax). No `@font-face`, no
  `@import` of any font, anywhere in the frontend. The font is referenced 28 times and
  loaded zero times.
- `designs/design-system/DESIGN.md` front-matter specifies the typography scale:
  heading styles (`h1`–`h4`) use `fontFamily: Playfair Display`, body styles
  (`body-lg`/`body-base`/`body-sm`/`body-xs`/`label-caps`) use `fontFamily: Inter`. The
  prose section states: **Heading Font**: "Playfair Display", serif; **Body Font**:
  "Inter", sans-serif. Weights listed: 300/400/500/600/700.
- `docs/decision_log.md` doesn't use the literal phrase "no config file", but decision
  #9 ("Styling: Tailwind CSS") plus `modern_frontend_tooling.md`'s CSS-first note is the
  documented basis for the project's config-free `@theme`-only approach; there is no
  `tailwind.config.js` in the tree, confirming the practice matches the intent.

---

## 1. How `@theme` works in Tailwind v4

**Source:** [Tailwind CSS docs — Theme variables](https://tailwindcss.com/docs/theme) (fetched directly).

`@theme` is a Tailwind-specific at-rule, distinct from plain CSS. A theme variable
declared inside `@theme` does two things at once:

1. It emits a normal CSS custom property on `:root` (usable via `var(--font-display)`
   anywhere, including inline styles and arbitrary values).
2. It **registers the token with Tailwind's utility generator**, which mints a utility
   class (and any related variants) named after the token.

Per the docs: *"Theme variables aren't just CSS variables — they also instruct Tailwind
to create new utility classes that you can use in your HTML."*

### `@theme` vs. plain `:root`

> "Use `@theme` when you want a design token to map directly to a utility class, and use
> `:root` for defining regular CSS variables that shouldn't have corresponding utility
> classes."

A variable defined in `:root { --brand-x: #fff }` is a normal custom property — usable
via `var()` — but Tailwind will **not** generate a `bg-brand-x` / `text-brand-x` / etc.
utility for it. Only variables inside a top-level `@theme { ... }` block get turned into
utilities. `@theme` blocks must be top-level (not nested inside a selector or media
query).

### Token namespaces → utility classes (from the docs)

| Namespace | Utilities generated |
|---|---|
| `--color-*` | Color utilities — `bg-*`, `text-*`, `border-*`, `fill-*`, etc. |
| `--font-*` | Font-family utilities — `font-sans`, `font-serif`, custom `font-<name>` |
| `--text-*` | Font-size utilities — `text-xl`, `text-base`, ... (paired `--text-*--line-height` etc. sub-keys) |
| `--font-weight-*` | `font-bold`, `font-semibold`, ... |
| `--tracking-*` | `tracking-wide`, `tracking-tight`, ... |
| `--leading-*` | `leading-tight`, `leading-relaxed`, ... |
| `--breakpoint-*` | Responsive variants `sm:`, `md:`, `lg:`, ... |
| `--container-*` | Container-query variants and `max-w-*` sizing |
| `--spacing-*` | Spacing/sizing scale — `p-*`, `m-*`, `w-*`, `h-*`, `gap-*`, ... |
| `--radius-*` | `rounded-*` |
| `--shadow-*` / `--inset-shadow-*` / `--drop-shadow-*` | `shadow-*`, `inset-shadow-*`, `drop-shadow-*` |
| `--blur-*` | `blur-*` |
| `--aspect-*` | `aspect-*` |
| `--ease-*` | `ease-*` transition-timing utilities |
| `--animate-*` | `animate-*` |

The namespace prefix is what tells Tailwind which utility family to wire the token
into; the suffix becomes the utility's variant name (`--font-display` → `font-display`,
`--color-brand` → `bg-brand`/`text-brand`/etc.).

### Adding vs. overriding vs. resetting

```css
@theme {
  /* add a new font utility alongside the defaults */
  --font-poppins: Poppins, sans-serif;

  /* override a default value */
  --breakpoint-sm: 30rem;

  /* wipe every default color, keep only these two */
  --color-*: initial;
  --color-white: #fff;
  --color-purple: #3f3cbb;
}
```

`--<namespace>-*: initial;` is the documented way to clear a whole namespace before
redefining it from scratch.

### `@theme inline`

**Source:** same page, [Tailwind CSS docs — Theme variables](https://tailwindcss.com/docs/theme).

Normally a theme variable's utility just re-emits `var(--the-token)`, so at runtime the
utility resolves through the CSS variable indirection. This breaks when the token's
*value itself* is another variable defined outside the theme (e.g. one set by a
JS framework or `:root` block), because of how CSS variable scoping/cascading resolves
inside `@theme`. `@theme inline` fixes this by making Tailwind bake in the **value**
directly instead of re-referencing the variable:

```css
@theme inline {
  --font-sans: var(--font-inter); /* --font-inter set elsewhere, e.g. by next/font */
}
/* generates: .font-sans { font-family: var(--font-inter); } directly, correctly resolved */
```

This project doesn't need `@theme inline` today — there's no other system (like
`next/font`) injecting the font variable — but it's the right tool if a build step ever
injects font tokens as CSS variables from outside `index.css`.

---

## 2. Registering a custom font family as a first-class utility — and whether the arbitrary form works at all

**Source:** [Tailwind CSS docs — font-family](https://tailwindcss.com/docs/font-family) (fetched directly).

### The registered-utility approach

```css
@import "tailwindcss";

@theme {
  --font-display: "Playfair Display", serif;
}
```

```html
<h1 class="font-display">...</h1>
```

Tailwind mints `font-display` from the `--font-display` token, exactly like the built-in
`font-sans` / `font-serif` / `font-mono` (`--font-sans`, `--font-serif`, `--font-mono` in
the default theme). Per-font OpenType feature/variation settings can ride along on the
same token:

```css
@theme {
  --font-display: "Playfair Display", serif;
  --font-display--font-feature-settings: "cv02", "cv03", "cv04", "cv11";
}
```

### The arbitrary-value form the codebase uses today

`font-['Playfair_Display']` is Tailwind's bracket/arbitrary-value syntax
(`font-[<value>]`, underscores standing in for spaces). The docs demonstrate the same
pattern for a one-off font (`font-[Open_Sans]`) and are explicit that **Tailwind does
not fetch or register font files for you, ever** — arbitrary or theme-token alike. The
docs' own example of adding a custom font always pairs the `@theme` token (or the
arbitrary class) with a preceding `@font-face` or `@import`:

```css
@font-face {
  font-family: Oswald;
  font-style: normal;
  font-weight: 200 700;
  font-display: swap;
  src: url("/fonts/Oswald.woff2") format("woff2");
}
```

or

```css
@import url("https://fonts.googleapis.com/css2?family=Roboto&display=swap");
@import "tailwindcss";

@theme {
  --font-roboto: "Roboto", sans-serif;
}
```

(Note the `@import url(...)` for the font **must be the very first line**, above
`@import "tailwindcss";` — browsers require `@import` rules to precede all other
statements, and the docs call this out explicitly.)

**Does `font-['Playfair_Display']` "work" when the font is never loaded/registered?**
Yes and no, and the distinction is the actual bug:

- **It compiles.** Tailwind has no way to know whether "Playfair Display" is a real,
  loaded font — it just emits `font-family: Playfair Display;` as valid CSS. No
  build error, no warning.
- **It has zero visual effect**, because loading a font is a browser/CSS-platform
  concern, not a Tailwind concern, and nothing in this codebase ever loads Playfair
  Display. Confirmed against
  [MDN's `font-family` reference](https://developer.mozilla.org/en-US/docs/Web/CSS/font-family)
  (primary source for browser font-matching behavior, since this part of the question
  is general CSS platform behavior, not Tailwind-specific): *"The browser will select
  the first font in the list that is installed or that can be downloaded using an
  `@font-face` at-rule."* If no listed name is installed on the user's OS and none was
  registered via `@font-face`, the browser falls through to its default font resolution
  for that element (MDN also stresses: *"You should always include at least one generic
  family name in a `font-family` list, since there's no guarantee that any given font
  is available. This lets the browser select an acceptable fallback font when
  necessary."*). `font-['Playfair_Display']` supplies **no fallback at all** — it's a
  single bare name — so on a machine that happens not to have "Playfair Display"
  installed as a system font (true for essentially every visitor), the class silently
  renders in whatever font the browser/UA stylesheet would have used anyway. That
  matches the bug as filed: the class appears 28 times, does nothing, and there is no
  error to signal why.

**Conclusion:** the arbitrary form is syntactically valid Tailwind and will never error,
but it is inert without a `@font-face`/`@import` registering that family somewhere in
the cascade — this repo has none. This is the root cause, confirmed from Tailwind's own
docs (which never claim to auto-load fonts, and always show registration as a
prerequisite step) plus MDN's normative description of `font-family` fallback.

---

## 3. Self-hosting (Fontsource) vs. a Google Fonts `<link>`

### Google Fonts `<link>`

**Source:** direct fetch of the actual CSS Google serves —
`https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&display=swap`
(this is the real, live endpoint the `<link>` tag points at; fetched directly, not
described secondhand):

```css
@font-face {
  font-family: 'Playfair Display';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url(https://fonts.gstatic.com/s/playfairdisplay/v40/....ttf) format('truetype');
}
/* + one @font-face block per requested weight */
```

Confirmed facts:
- Google's generated CSS already sets `font-display: swap` by default (minimal
  invisible-text period, immediate fallback-font paint, swaps in once loaded — see
  FOUT/FOIT breakdown below). This is baked into the URL's `&display=swap` query param,
  which Google's docs param name matches.
- The `<link>` approach requires two round-trips off your own origin: one to
  `fonts.googleapis.com` for the CSS, one to `fonts.gstatic.com` for the actual font
  binary. Standard practice (used by Google's own font-picker "Embed" panel output, and
  widely documented) is to `preconnect` both origins ahead of the `<link>` so DNS/TLS
  setup for those two hosts overlaps with the rest of page load instead of blocking
  after the CSS request resolves:
  ```html
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&display=swap" rel="stylesheet">
  ```
  I could not find this exact 3-line snippet stated in a fetchable page of Google's
  written docs (the `fonts.google.com` "Knowledge" page didn't return readable body
  content, and `developers.google.com/fonts` doesn't mention `preconnect`), so I'm not
  citing an official-docs source for the *preconnect* recommendation specifically — flag
  this as **not independently source-verified**, though it is the output Google's own
  font-picker UI has been known to emit and is uncontroversial web-perf practice
  (`crossorigin` is required on the `gstatic.com` preconnect because font fetches are
  always CORS/anonymous-mode per the Fonts spec).
- Privacy: every visitor's browser makes a live request to Google's servers at page
  load. Fontsource's own docs are explicit about this trade-off (see below) — I did not
  find a Google-authored statement quantifying what Google logs from font requests, so
  the privacy claim below is sourced to Fontsource, not Google.

### Self-hosting via Fontsource

**Source:** [Fontsource docs — Getting Started](https://fontsource.org/docs/getting-started/introduction)
and [Install](https://fontsource.org/docs/getting-started/install) (fetched directly),
plus the actual npm package CSS fetched from jsDelivr's CDN mirror of the published
package (i.e. the real generated output, not a description of it).

Install and import:

```bash
npm install @fontsource/playfair-display @fontsource/inter
```

```ts
// main.tsx or index.css via @import — default weight only (400)
import "@fontsource/playfair-display";
import "@fontsource/inter";

// or pick exact weight/style
import "@fontsource/playfair-display/700.css";
import "@fontsource/inter/400-italic.css";
```

Verified directly from the published `@fontsource/playfair-display@5.3.0` package
(fetched via jsDelivr, `latin-400.css`):

```css
/* playfair-display-latin-400-normal */
@font-face {
  font-family: 'Playfair Display';
  font-style: normal;
  font-display: swap;
  font-weight: 400;
  src: url(./files/playfair-display-latin-400-normal.woff2) format('woff2'),
       url(./files/playfair-display-latin-400-normal.woff) format('woff');
}
```

Confirmed facts:
- Fontsource ships `font-display: swap` **by default** in every generated `@font-face`
  block — same FOUT-favoring strategy as Google's endpoint, but the files are served
  from your own build/CDN instead of Google's.
- **Subsetting is real and file-level**, not just a doc claim: the published package
  file list (queried directly from the npm registry via jsDelivr's package API) for
  `@fontsource/playfair-display@5.3.0` includes `cyrillic.css`, `cyrillic-400.css`,
  `latin.css`, `latin-400.css`, `latin-400-italic.css`, etc. — one file per
  subset×weight×style combination, so you only ship the character ranges you use
  (`import "@fontsource/playfair-display/latin-400.css"` pulls Latin-only glyphs at
  weight 400).
- **Variable fonts** (`@fontsource-variable/*`) bundle every weight (and sometimes an
  italic/optical-size axis) into fewer files using `font-weight: 100 900` ranges and
  `format('woff2-variations')`, confirmed from the real
  `@fontsource-variable/inter@5.3.0` `index.css` output:
  ```css
  @font-face {
    font-family: 'Inter Variable';
    font-style: normal;
    font-display: swap;
    font-weight: 100 900;
    src: url(./files/inter-cyrillic-ext-wght-normal.woff2) format('woff2-variations');
    unicode-range: U+0460-052F, U+1C80-1C8A, ...;
  }
  /* one such block per unicode-range subset; browser only downloads the one it needs */
  ```
  **Important naming gotcha, verified from the actual output:** the variable package
  registers the family as `'Inter Variable'`, not `'Inter'`. Any `@theme` token pointing
  at the variable build must say `--font-body: "Inter Variable", sans-serif;`, not
  `"Inter"`, or the browser will fail to match and silently fall back (same failure mode
  as the Playfair bug this ticket is about). Same pattern confirmed for
  `@fontsource-variable/playfair-display@5.3.0`: its `index.css` registers
  `font-family: 'Playfair Display Variable'` with `font-weight: 400 900` — covers every
  weight DESIGN.md's H1–H4 scale uses (400/500/600).
  Fontsource's own [variable-fonts guide](https://fontsource.org/docs/getting-started/variable)
  documents installing `@fontsource-variable/<font>` and importing specific axes, e.g.
  `import "@fontsource-variable/nunito-sans/wght-italic.css";`, and recommends variable
  builds specifically to cut bundle size when multiple weights are needed — directly
  applicable here since DESIGN.md's typography scale uses weights 300–700.
- Privacy/version-stability claims, quoted directly from Fontsource's own intro page:
  *"Google does track the usage of their fonts and for those who are extremely privacy
  concerned, self-hosting is an alternative"* and self-hosted fonts are *"version
  locked"* (no surprise upstream changes) and *"load offline."*
- No `preconnect`/cross-origin dance is needed for the self-hosted route: the font
  files are served from the same origin as the app bundle (bundled by Vite), so there's
  no second DNS/TLS handshake to hide — this is inherent to self-hosting, not a claim
  from a specific doc page.

### FOUT/FOIT and `font-display`, generally

**Source:** [MDN — `font-display`](https://developer.mozilla.org/en-US/docs/Web/CSS/@font-face/font-display).

| Value | Invisible-text (FOIT) window | Swap window | Net effect |
|---|---|---|---|
| `block` | short but real | infinite | Brief invisible text, then swaps in whenever the font finishes loading, however long that takes |
| `swap` | ~0 | infinite | No invisible text; renders in fallback immediately, swaps to real font whenever it arrives — classic FOUT |
| `fallback` | ~0 | short, then gives up | Minimal FOUT; if font is slow it never swaps in for that paint |
| `optional` | ~0 | none | Uses cached font only; never blocks or swaps on this load |
| `auto` | browser default | browser default | Unspecified, varies |

Both the Google Fonts endpoint and Fontsource's generated CSS default to `swap` for
Playfair Display / Inter, so on that axis the two approaches behave identically — the
difference is purely about **where the bytes come from** (Google's CDN + a cross-origin
request vs. your own bundled origin), not about FOUT/FOIT strategy.

---

## 4. One token set feeding both utility classes and raw CSS (DESIGN.md as source of truth)

**Source:** [Tailwind CSS docs — Theme variables](https://tailwindcss.com/docs/theme)
and [Adding custom styles](https://tailwindcss.com/docs/adding-custom-styles) (both
fetched directly).

Because `@theme` compiles every token to a plain `:root` custom property *in addition
to* registering the utility, the same declaration is consumable three ways:

```css
@import "tailwindcss";

@theme {
  --font-display: "Playfair Display", serif;
  --font-body: "Inter", sans-serif;
  --color-primary: #1A1A1A;
  --color-bg-cream: #F9F7F4;
}
```

1. **Generated utility classes** — `className="font-display text-primary bg-bg-cream"`.
2. **Raw/custom CSS via `var()`** — for anything not expressible as a utility (e.g. a
   third-party component's stylesheet, a `<style>` block, or a CSS-in-JS value):
   ```css
   @layer base {
     h1 { font-family: var(--font-display); }
   }
   ```
   ```html
   <div style="color: var(--color-primary)">...</div>
   ```
3. **Arbitrary-value shorthand referencing the same token** — `fill-(--color-primary)`,
   documented as sugar for `fill-[var(--color-primary)]`.

This gives the project exactly one authORING location for the numbers in
`designs/design-system/DESIGN.md` (colors, font families, the type scale) — the
`@theme` block in `index.css` — with both Tailwind utilities and any hand-written CSS
reading from that single set of custom properties. There is no need to hand-maintain a
parallel `:root` block or a `tailwind.config.js` theme object: `@theme` **is** the
`:root` block, plus utility registration, in one step.

---

## Summary of what's verifiable vs. not

| Claim | Status |
|---|---|
| `@theme` generates both a CSS var and a utility class; namespace table; `@theme inline` semantics | Verified — Tailwind CSS official docs, fetched directly |
| Custom `--font-*` token → `font-<name>` utility; per-font feature/variation-setting sub-keys | Verified — Tailwind CSS official docs |
| Tailwind never auto-loads/registers fonts, for theme tokens or arbitrary values alike | Verified — Tailwind CSS official docs (registration always shown as a prerequisite step) |
| Unregistered/unloaded `font-family` silently falls back per browser font-matching rules | Verified — MDN `font-family` reference (general CSS platform fact, not Tailwind-specific) |
| `@tailwindcss/vite` needs no `tailwind.config.js`, minimal CSS is `@import "tailwindcss"` | Verified — Tailwind CSS official Vite install docs, matches this repo's actual files |
| Google Fonts CSS endpoint defaults to `font-display: swap`, per-weight `@font-face`, served from `fonts.gstatic.com` | Verified — fetched the live `fonts.googleapis.com/css2` endpoint directly |
| Fontsource packages: per-subset/per-weight files, `font-display: swap` default, `@fontsource-variable` bundling with `format('woff2-variations')` and `unicode-range` splitting | Verified — fetched actual published package CSS via jsDelivr/npm registry data, plus Fontsource's own docs |
| Variable-font family name differs from the static one (`'Inter Variable'` vs `'Inter'`) | Verified — fetched actual `@fontsource-variable/inter` package CSS |
| `preconnect`/`crossorigin` snippet for Google Fonts `<link>` | **Not independently source-verified** — could not retrieve readable body content from Google's own font-best-practices pages; the 2-line preconnect snippet is extremely widely documented and matches what Google's font picker has emitted, but I'm flagging it as sourced to general practice, not a fetched Google doc |
| Google's exact server-side privacy/tracking practices for font requests | **Not verified against a Google-authored source** — the privacy claim in this doc is attributed to Fontsource's own docs, not to Google |

---

## Recommended approach (short version — see the ticket's `## Answer` for the full recommendation)

Self-host both faces via Fontsource (`@fontsource-variable/playfair-display` +
`@fontsource-variable/inter`, since DESIGN.md needs weights 300–700 on the body face and
400/500/600 on headings — a variable build avoids shipping 5+ static files per family),
import them at the top of `frontend/src/index.css`, then register both as `@theme`
tokens (`--font-display`, `--font-body`) so the 28 existing `font-['Playfair_Display']`
call sites can be mechanically replaced with `font-display`.
