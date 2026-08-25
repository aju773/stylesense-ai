# 02 — Tailwind v4 font and design-token wiring

Type: research
Status: resolved
Blocked by: —

## Question

In Tailwind CSS v4 with the Vite plugin and no config file, how are custom
fonts and design tokens correctly wired?

The project runs Tailwind v4 via `@tailwindcss/vite` with a deliberately
config-free setup (see `docs/decision_log.md`). `frontend/src/index.css` is
currently the single line `@import "tailwindcss";`.

Establish, with primary sources:

- How the **`@theme` directive** works in v4: what token namespaces exist
  (`--font-*`, `--color-*`, `--text-*`, and the rest), how a token name maps to
  a generated utility class, and how `@theme` differs from plain `:root`
  custom properties.
- How to register a **custom font family** so it becomes a first-class utility
  (`font-display`, `font-serif`) rather than the arbitrary-value form
  `font-['Playfair_Display']` the codebase uses today. Confirm whether the
  arbitrary form works at all without registration.
- **Self-hosting versus a Google Fonts link** for Playfair Display and the body
  face: the trade-off in FOUT/FOIT behaviour, `font-display` strategy, subsetting,
  and privacy. Cover Fontsource and `@fontsource-variable` packages as the
  self-hosted route, and what `preload` / `preconnect` each approach needs.
- How a token set defined once in `@theme` can be consumed both by utility
  classes and by raw CSS, so `designs/design-system/DESIGN.md` can be the single
  source of truth.

Record the findings as a Markdown file in `docs/` and link it from this ticket.

## Answer

Full findings, citations, and code examples:
[`docs/research-tailwind-v4-theme-fonts.md`](../../../docs/research-tailwind-v4-theme-fonts.md)

### Summary

- **`@theme` in v4 does two things per token**: emits a `:root` CSS custom property
  *and* registers a generated utility class. Plain `:root` only gets you the former —
  no utility. Namespace prefix decides the utility family (`--font-*` → `font-*`,
  `--color-*` → `bg-*`/`text-*`/etc., `--text-*` → font-size utilities, `--spacing-*`,
  `--radius-*`, `--shadow-*`, `--breakpoint-*`, `--ease-*`, `--animate-*`, …).
  `@theme inline` bakes in a referenced variable's *value* instead of re-pointing at it
  — needed only if some other layer injects the font/color as an external CSS variable,
  which this project doesn't do.
- **Root cause of the bug, confirmed from Tailwind's own docs**: Tailwind never loads or
  registers font files, for `@theme` tokens or arbitrary values alike — its docs always
  show a `@font-face`/`@import` step as a prerequisite. `font-['Playfair_Display']`
  compiles to valid CSS (`font-family: Playfair Display;`) with **no error**, but per
  MDN's `font-family` spec description, an unregistered/uninstalled name with no
  fallback list just falls through to the browser's default font resolution — silently.
  That's exactly the symptom: 28 call sites, zero visible effect, no build warning.
- **Self-hosting vs. Google Fonts `<link>`**: verified directly against both live
  outputs. Google's CSS endpoint and Fontsource's published packages both default to
  `font-display: swap` (fast FOUT, no invisible-text block) — so FOUT/FOIT behavior is a
  wash. The real differences: Google needs a cross-origin round trip (two hosts,
  `fonts.googleapis.com` + `fonts.gstatic.com`, each visitor's browser talks to Google
  directly — a privacy trade-off per Fontsource's own docs) and benefits from
  `preconnect` hints (this exact snippet was **not** independently verified against a
  fetchable Google doc — flagged as unverified, though it's standard/uncontroversial
  practice); Fontsource ships the font files inside your own Vite bundle, same-origin,
  no preconnect needed, with real per-subset files (confirmed file list:
  `latin-400.css`, `cyrillic-700.css`, etc.) and `@fontsource-variable/*` packages that
  bundle a full weight range into one `format('woff2-variations')` file per
  unicode-range subset — verified the variable build registers the family as
  `'Inter Variable'`, **not** `'Inter'`, which matters for the `@theme` token value.
- **Single source of truth**: because `@theme` tokens are just `:root` vars *plus*
  utility registration, the same block feeds Tailwind classes (`font-display`,
  `text-primary`), raw CSS (`var(--font-display)`), and the arbitrary-value shorthand
  (`fill-(--color-primary)`) — one `@theme` block in `index.css`, sourced from
  DESIGN.md's values, can be the only place those numbers live.

### Recommendation

1. **Loading mechanism**: self-host via Fontsource, not a Google Fonts `<link>`. Install
   `@fontsource-variable/playfair-display` and `@fontsource-variable/inter` (variable
   builds — DESIGN.md's scale spans weights 300–700, so one file per family beats
   5+ static weight files each). Import both at the very top of
   `frontend/src/index.css`, before `@import "tailwindcss";` — the only real cost of
   the self-hosted route is npm package install size, and it avoids the cross-origin
   request and the unverified-preconnect question entirely.
2. **Token namespace**: register both faces in `@theme` as `--font-*` tokens —
   `--font-display: "Playfair Display Variable", serif;` and
   `--font-body: "Inter Variable", sans-serif;` (note the `Variable` suffix on the
   family name — confirmed from the actual package output, easy to get wrong). This
   produces first-class `font-display` / `font-body` utilities. Layer in DESIGN.md's
   remaining tokens the same way: `--color-*` for the ~60 color tokens,
   `--text-*`/`--font-weight-*`/`--tracking-*`/`--leading-*` for the H1–H4/body-\*/label
   scale, so `@theme` becomes the single source of truth DESIGN.md already implies.
3. **Migrate the 28 call sites**: yes — mechanically replace every
   `font-['Playfair_Display']` with `font-display` (a straight find/replace across the
   17 files listed in the research doc) once the `@theme` token exists. Leaving the
   arbitrary form in place after registering the token would just mean two ways to say
   the same thing, one of them still fragile if the string literal is ever mistyped.

This ticket is research-only per its constraints; the `index.css`/`index.html` changes
and the 28-site migration are left for the implementation ticket.
