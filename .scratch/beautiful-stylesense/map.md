# Beautiful StyleSense

Label: wayfinder:map

## Destination

A complete, agreed spec for **Epic 11 — Beautiful StyleSense**, landed as
`planning/stylesense-ai/issues/11-*.md` plus numbered sub-tickets, covering six
surfaces: design foundation, product imagery, home page, shop filter bar, AI
chat product output, and the profile Style Profile.

Decisions only. Implementation is a separate effort that starts once this map is
closed.

## Notes

**Domain:** frontend UI/UX + supporting backend contracts for StyleSense AI, a
Django + React/Vite AI fashion-stylist storefront. Design language is
"Editorial Luxury" — see `designs/design-system/DESIGN.md` and the per-page
`screen.png` / `code.html` pairs under `designs/`.

**Four expert personas** carry every ticket in this map — surface all four
viewpoints before proposing an answer:

- **Visual Director** — typography, rhythm, imagery, luxury feel
- **UX Architect** — interaction model, information scent, navigation
- **Frontend Engineer** — feasibility, state, perf, what breaks
- **Commerce Strategist** — what the surface must *do*, conversion path

**Skills every session should consult:** `/grilling` and `/domain-modeling` by
default; `/prototype` for the prototype tickets; `/research` for the research
tickets.

**Standing preferences for this effort:**

- No new backend models. Bind new UI to data that already exists.
- Prefer fixing foundations over adding surfaces — the font and the imagery
  gaps move "beauty" further than any single new page.
- Every merchandising tile must land on a real, working destination. No dead
  links for visual effect.
- Deviations from the design files are allowed but must be recorded as a
  decision with its reason (the shop filter rail is already one).

**Prototypes** built for tickets 06, 09 and 12 live on branch `prototype/beautiful-stylesense` (commit `3680b78`), deliberately unmerged. `main` carries only the decisions they produced.

**Findings that shaped the map** (established while charting, do not re-derive):

- `frontend/src/index.css` is one line, `@import "tailwindcss";`. Playfair
  Display is never loaded, yet `font-['Playfair_Display']` appears 28 times
  across 17 files. Every heading falls back to a system serif.
- `docs/products.json` has 50 products and **zero** `image_url` values, though a
  `ProductImage` table already exists to hold them. Every card in the app
  renders a gradient placeholder.
- The AI chat product cards already render images, prices, a save-heart, and
  link to `/products/:slug` — `ChatProductStrip.tsx`. They are blocked on data,
  not code.
- `backend/apps/products/filters.py` gives every facet a single-value
  `CharFilter`. There is no `ordering` param and no counts endpoint anywhere.
- `User.style_preferences` is a `JSONField` that exists and is completely
  unused.
- An ancestor with `backdrop-filter` creates a containing block, so
  `position: fixed` inside it resolves against that ancestor, not the viewport.
  `SiteHeader` already uses `backdrop-blur-md` and the new filter bar adds
  another — every fixed overlay rendered inside either (cart drawer, mobile
  filter sheet, any future modal) must be portalled to `document.body`. Found
  while building ticket 06's prototype.

## Decisions so far

**Correction (post-charting, caught by an implementing agent):** the charting
session and ticket 04 assumed `Product` carried its own `image_url` field
alongside the `ProductImage` table, and treated dropping that field as part of
decision 1. It does not exist — `Product` has no image field of its own; only
`ProductImage` (per-product photos) and `Category.image_url` (a category
thumbnail, unrelated and out of scope) exist. `ProductImage` is still the
correct single source and every other finding in ticket 04 stands; there is
just nothing to delete and no migration to write for it. Fixed in ticket 04,
`00-charting.md`, `01-photography-sources.md`, and the epic docs.


- [Destination shape](issues/00-charting.md) — a spec, not an implementation: decisions land as an epic doc plus sub-tickets, execution follows separately.
- [Product imagery approach](issues/00-charting.md) — hand-map curated editorial stock photography to all 50 products; gradients are a stopgap, not a look.
- [Scope](issues/00-charting.md) — Home, Shop filters, AI chat output, Profile, plus a cross-cutting design foundation. Profile is in because it is the only other stub route.
- [Shop filter placement](issues/00-charting.md) — top filter bar with a full-width grid, a deliberate deviation from `designs/page-shop` which draws a left rail. Reason: a wall of facets contradicts an app whose pitch is that the AI narrows for you.
- [Shop filter depth](issues/00-charting.md) — full faceted search: multi-select facets, sort, and live counts. Backend work included; at 50 rows there is no perf story to defend.
- [AI chat output](issues/00-charting.md) — break the product strip out of the assistant bubble, larger cards, Add to Bag, and a per-card rationale. Inline marker-position cards ruled out of scope.
- [Home page data](issues/00-charting.md) — build the full visual design but adapt every band to existing data; no Collection model, no trending flag.
- [Profile scope](issues/00-charting.md) — Personal Information plus a Style Profile wired into `SYSTEM_PROMPT`. Security & Access dropped.
- [Design foundation](issues/00-charting.md) — one foundation ticket covering font loading, design tokens, a site footer, and the page title, resolved before any surface prototype.
- [Spec landing place](issues/00-charting.md) — an Epic 11 doc in `planning/stylesense-ai/issues/` carrying the reasoning, plus numbered sub-tickets matching the repo's existing convention.

- [Fashion photography sources](issues/01-photography-sources.md) — Unsplash primary, Pexels as gap-filler, Pixabay ruled out because its API forbids permanent hotlinking. Unsplash is the only source with a documented resize/format pipeline on a permanent URL, and its API Guidelines make attribution mandatory even though the licence does not. The old `source.unsplash.com` random endpoint is confirmed dead.
- [Faceted search in django-filter](issues/03-faceted-search-django.md) — repeated-key params read via `getlist()`, `has_any_keys` for OR-membership on the JSON array columns, one `.aggregate()` per facet with `Count(filter=Q(...))` scoped to the other active filters, and `OrderingFilter` with an explicit allow-list. Found a real correctness trap: `colors__contains=[...]` with two values silently means AND, not OR.

- [Tailwind v4 fonts and tokens](issues/02-tailwind-v4-fonts-tokens.md) — self-host both faces via Fontsource variable packages, register them as `--font-*` tokens in a single `@theme` block that becomes the source of truth for `DESIGN.md`, and migrate all 28 arbitrary-value call sites to a real `font-display` utility. Root cause confirmed: Tailwind never loads font files for arbitrary values *or* `@theme` tokens, so `font-['Playfair_Display']` compiles to valid CSS that silently falls through to the browser default.

- [Design foundation](issues/05-design-foundation.md) — the markdown palette in `DESIGN.md` is canonical and its Material-3 frontmatter twin stays unwired; `@theme` carries colours, fonts, and the type scale only, because radii and shadow tokens would silently restyle nine built pages; both faces self-host via Fontsource, Playfair as `--font-display` with all 28 call sites migrated and Inter overriding `--font-sans` so body text inherits it with no edits; two-row header whose wordmark row retracts on scroll, exposing the never-surfaced `search` param for the first time; three-column footer with the Support column and newsletter cut for having no destinations, on every route but `/chat` and `/checkout`; per-route titles from a small hook, and a favicon that is not a purple lightning bolt.

- [Imagery plan](issues/04-imagery-plan.md) — `ProductImage` is confirmed the single source (`Product` itself carries no image field, contrary to the charting session's initial assumption — corrected in the ticket); one curated photo per product with gallery views derived as imgix crops of that same photo, because three different stock photos of "linen trousers" are three different garments; everything sourced and stored at 4:5 with the four outlier surfaces converging; the 50 URLs live in `docs/products.json` behind an idempotent seed path; gradients become a quiet neutral placeholder with `onError` finally wired; one footer credit line rather than per-photo bylines; four more curated photos for the home hero and The Edit. Found a defect: `ProductSerializer` sends no image field at all, so the shop grid could not show a photo even with perfect data.

- [Shop filter bar](issues/06-filter-bar-prototype.md) — popover bar with instant apply, counts in each dropdown, and the chip row kept because price only ever surfaces as a chip; zero-count options stay visible and disabled rather than reflowing the list; on `/shop` the whole header retracts so the bar takes the sticky slot at 56px net; grid ladder 2/3/4 with the design's density toggle dropped; mobile gets the portalled filter sheet. Prototype at `frontend/src/pages/prototype/FilterBarPrototype.tsx`.

- [Chat card layout](issues/09-chat-card-prototype.md) — the picks leave the assistant bubble entirely and become an attributed block headed `N picks for you`, because it is the only layout that gives the rationale a full line while keeping the photograph at ~210px; skeletons are sized by counting `[[product:id]]` markers as the text streams, information the browser already parses and discards; mobile collapses the block to editorial rows; and the catalog and chat cards converge into one component with optional rationale and action slots. Prototype at `frontend/src/pages/prototype/ChatCardsPrototype.tsx`. Two findings for ticket 10: Add to Bag is really "open a size/colour picker", and the block can never exceed five cards because `ContextBuilder(top_k=5)`.

- [Style Profile contract](issues/11-style-profile-contract.md) — schema adapted to the catalog rather than the design: vibes, one size, budget in ₹, plus a gender preference the design never asked for, with the design's US-numeric top/bottom split dropped because `Product.sizes` is a single lettered array; the vibe vocabulary is closed, since free text here is user input landing inside `SYSTEM_PROMPT`; preferences reach both the prompt and the embedded query, but **only gender filters retrieval hard** — size and budget stay advisory so the stylist can say "ideal, but only in L" instead of hiding it; an empty profile says nothing and the stylist may ask once per conversation; read-only, so the profile page is the only writer; `MeView` becomes `RetrieveUpdateAPIView`. Requires `ContextBuilder` to receive the user, which it currently never does.

- [Faceted API contract](issues/07-faceted-api-contract.md) — `CursorPagination` is retired for `PageNumberPagination`, because cursor pagination returns no `count` and constrains the ordering field, and ticket 06 committed to both a true result count and a free choice of sort; facets ride on the list response so counts and results can never disagree in the same bar; `Recommended` binds to `-rating, -created_at` rather than a best-seller count that a demo database would make near-random; Brand becomes an exact multi-select facet fed by the same aggregate, retiring its `icontains`; repeated-key params, which keep every existing shared link working for free. Also recorded: the shop grid's missing image is a one-line serializer fix, since the queryset already prefetches.

- [Home page bindings](issues/08-home-band-bindings.md) — hero CTA bounces to login and back, plumbing that already exists; all three AI cards rewritten, because the design promises inspiration-photo upload the app has nowhere while never mentioning the rationale, preference-awareness, and add-to-bag this map just specified; Trending Now reuses ticket 07's `recommended` binding so VIEW ALL continues the same ordering; The Edit becomes For Her / For Him / Unisex, since the design's Best Sellers would have resolved to the same query as Trending Now; trust bar keeps four tiles but swaps Easy Returns and Secure Checkout — a security claim about a mock gateway — for Order Tracking and Save & Compare, both fully built and never advertised. Free Shipping turned out to be literally true. One page for everyone.

- [Chat rationale and Add to Bag](issues/10-chat-rationale-addtobag.md) — the `[[product:id]]` marker is left untouched and reasons arrive as `[[why:id]]` lines appended after the prose, which streams cleanly and, because `ChatMessage.content` already persists markers, reparses from stored content on history load with no schema change at all; non-compliance degrades silently per pick rather than suppressing the feature; the picker expands the card in place, since `cart_service._validate_variant` makes a one-click add impossible for every product in the catalog; confirmation is inline rather than the cart drawer, deliberately departing from `ProductDetail` because a drawer covers the four picks still unread; and retrieval filters `stock > 0` while the card keeps its out-of-stock state, because stock moves and history replays.

- [Profile page composition](issues/12-profile-page-composition.md) — style-first, with Personal Information collapsed into a disclosure, because with Security out of scope the design's seven-item account nav reduces to two real tabs plus two links that leave the page, and Personal Information is three fields; budget becomes preset chips rather than the design's slider, since ticket 11 made budget advisory and the slider's precision has no consumer; one page-level save, because a per-band button inside a collapsed disclosure is unreachable and the API is a single PATCH anyway; and the callout ships rewritten, its "bespoke lookbooks" claim cut for the same reason ticket 08 cut photo upload. Sign Out stays in `SiteHeader`. Prototype at `frontend/src/pages/prototype/ProfilePrototype.tsx`.

- [Epic 11 written and sliced](issues/13-write-epic-and-slice.md) — `planning/stylesense-ai/issues/11-beautiful-stylesense.md` plus sub-tickets 11.1–11.11, ordered so foundation and imagery land first, each carrying its own decisions in the house style so it can be implemented without reading this map. `progress.md` updated. **This map's destination is reached.**

## Not yet specified

All six fog patches were moved into the epic doc's **Open questions** section by
ticket 13 and now live only there, so the two do not diverge. See
`planning/stylesense-ai/issues/11-beautiful-stylesense.md`.

## Out of scope

- **Profile Security & Access** — password change, active sessions with revoke,
  phone and date-of-birth fields. Session tracking is a subsystem, not a
  ticket, and none of it makes the app more beautiful.
- **`COLLECTIONS` and `ABOUT` routes, and a Collection model.** The home design
  draws them; this effort binds those tiles to filtered `/shop` queries instead.
- **Hardcoded-hex to token refactor of the nine already-built pages.** A
  worthwhile cleanup epic, but it is maintenance across working code rather
  than a step toward this destination.
- **Inline marker-position chat cards.** Placing each card where its
  `[[product:id]]` marker sits in the prose would reopen the WebSocket
  streaming contract, which sends `products` as a separate event after the text.
  A viable follow-up once the breakout strip ships.
- **Conversational write-back of style preferences.** The stylist proposing a
  preference and the shopper confirming it is the better product, and it is the
  natural place preferences actually surface. Ruled out because it needs
  structured output or tool-calling, which this app has nowhere — the entire AI
  contract is prose plus text markers — plus a confirmation affordance in the
  chat stream and a write path with its own failure modes. That is an epic, not
  a slot in ticket 11. Silent inference was rejected on different grounds: model
  output must not mutate stored user data without the user knowing.
- **Guest chat for anonymous visitors.** Letting the landing page demonstrate the
  stylist rather than describe it is the better home page. Ruled out because
  `ChatViewSet` and the WebSocket consumer are both `IsAuthenticated`,
  `Conversation` is FK'd to a user, and `ChatMessage` rows persist per
  conversation — so it means anonymous sessions, ownership on nothing, throttling
  with no user to throttle, and a merge path at signup. An epic, not a ticket.
- **Implementation of anything on this map.**
