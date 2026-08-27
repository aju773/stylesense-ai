# 00 — Charting grill: destination, scope, and direction

Type: grilling
Status: resolved
Blocked by: —

## Question

What is this effort's destination, which surfaces are in scope, and what
direction does each one take?

## Answer

Resolved in the charting session, across ten decisions.

**1. Destination shape — a spec, not an implementation.**
The map produces decisions. Execution is a separate effort that begins once
this map closes. Rejected: carrying execution into the map, which would have
made each ticket a build slice rather than a decision.

**2. Product imagery — hand-map curated editorial stock to all 50 products.**
`docs/products.json` carries 50 products with zero `image_url` values, so every
card in the app renders a gradient placeholder with a letter. A `ProductImage`
table already exists to hold them; this is a data gap, not a code gap.
Rejected: a random-image API (breaks the "same product, same image" contract),
commissioned photography (cost and time), and shipping gradients forever
(makes the destination unreachable).

**3. Scope — Home, Shop filters, AI chat output, Profile.**
Home and Profile are the only two stub routes left in `App.tsx`. Profile was
pulled in because leaving a bare `<h1>` beside nine finished pages is the one
hole a reviewer falls into, and it costs roughly one ticket. Rejected: auditing
all nine built pages, which would triple the map.

**4. Shop filter placement — top filter bar, full-width grid.**
A deliberate deviation from `designs/page-shop`, which draws a 260px left rail.
Reason: the app's pitch is that the AI narrows the catalog for you, and a
permanent wall of facets contradicts that. A full-width grid also buys larger
product imagery, which is what actually sells fashion.

**5. Shop filter depth — full faceted search.**
Multi-select facets, a sort control, and live counts. The placement change is
only chrome; the real defect is behavioural. `backend/apps/products/filters.py`
gives every facet a single-value `CharFilter`, so Black **and** White is
impossible today, there is no `ordering` param, and no counts endpoint exists.
At 50 rows there is no performance argument against doing it properly, and the
design file already draws counts.

**6. AI chat output — breakout strip with Add to Bag and per-card rationale.**
`ChatProductStrip.tsx` already renders an image, brand, name, price, a
save-heart, and a `<Link>` to the product page, so the described feature
exists and is blocked on decision 2. The real gaps are quality: the strip is
capped inside a `max-w-[70%]` bubble at 160px per card, the card only links out
so advice cannot be acted on, and the AI's reasoning never attaches to the pick
it justifies. Inline marker-position cards were ruled out of scope.

**7. Home page — adapt to existing data, no new backend models.**
Build all six bands of `designs/page-home`, but bind "Trending Now" and "The
Edit" to filtered `/shop` queries over existing fields rather than introducing
a Collection model or a trending flag. `COLLECTIONS` and `ABOUT` nav entries are
dropped rather than shipped dead.

**8. Profile — Personal Information plus a Style Profile wired to the AI.**
`User.style_preferences` is an existing, entirely unused `JSONField`. Filling it
and feeding it to `SYSTEM_PROMPT` turns Profile from a settings page into the
app's differentiator. Security & Access was dropped: password change needs an
endpoint that does not exist, and active sessions need a device-tracking
subsystem.

**9. Design foundation — one ticket, resolved before any surface prototype.**
Playfair Display is never loaded. `frontend/src/index.css` is one line, and
`index.html` carries no font link, yet `font-['Playfair_Display']` appears 28
times across 17 files. Fonts, design tokens, a site footer, and the page title
land together, because prototyping a surface against the wrong typeface means
redoing it.

**10. Spec landing place — epic doc plus sub-tickets.**
`planning/stylesense-ai/issues/11-*.md` for the reasoning that makes the six
surfaces cohere, then numbered sub-tickets matching the convention every prior
epic followed, so `/implement` can pick them up directly.
