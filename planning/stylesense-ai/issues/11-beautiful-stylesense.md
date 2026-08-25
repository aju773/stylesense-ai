# 11 — Beautiful StyleSense (Foundation, Imagery, Home, Shop UX, Chat Cards, Profile)

**What to build:** Six surfaces that together make the app look and behave like the store its design language claims to be — a typography and token foundation the app has never actually loaded, real photography for a catalog that has none, the unbuilt home page, a shop filter that can express more than one value per facet, AI recommendations that explain themselves and can be acted on, and the profile page that finally makes the stylist personal.

**Blocked by:** 10 — Checkout & Orders

**Status:** ready-for-agent

Charted as a `/wayfinder` map at `.scratch/beautiful-stylesense/map.md`; every decision below has a ticket there carrying its full reasoning and the alternatives that lost.

- [ ] 11.1 — Typography, Design Tokens, and Document Head
- [ ] 11.2 — Site Chrome: Two-Row Header and Footer
- [ ] 11.3 — Product Imagery: Curation and Seeding
- [ ] 11.4 — Image Rendering: Serializer, Ratios, and Fallback
- [ ] 11.5 — Faceted Search API
- [ ] 11.6 — Shop Filter Bar
- [ ] 11.7 — Home Page
- [ ] 11.8 — Style Profile: Schema, API, and Prompt Injection
- [ ] 11.9 — Profile Page
- [ ] 11.10 — Chat Rationale Contract
- [ ] 11.11 — Chat Picks Block and Unified Product Card

## Why these six surfaces

The brief was "make it beautiful", naming the home page, the shop filter, and the AI chat output. Investigating those three turned up two problems underneath them that mattered more than any of the three.

**Playfair Display has never loaded.** `frontend/src/index.css` is one line, `@import "tailwindcss";`, and `index.html` carries no font link. Meanwhile `font-['Playfair_Display']` appears 28 times across 17 files. Tailwind never loads font files — not for arbitrary values, not for `@theme` tokens — so all 28 headings compile to valid, warning-free CSS and silently fall through to a system serif. The app's entire display typeface has never rendered.

**The catalog has no photographs.** `docs/products.json` holds 50 products and zero `image_url` values, though `Product.image_url` and a `ProductImage` table both exist. Every card in every surface renders a pastel gradient with a giant brand initial. And `ProductSerializer` — which backs the shop list — sends no image field at all, so the grid could not display a photo even with perfect data.

Fixing those two moves "beautiful" further than any new page does, and every surface below depends on both, which is why 11.1–11.4 come first.

The third surface in the brief turned out to be mostly built: `ChatProductStrip` already renders images, prices, a save heart, and a link to the product page. Its real gaps were quality — cards crammed into a `max-w-[70%]` bubble at 160px, no way to act on the advice, and the model's reasoning detached from the pick it justified.

Profile was pulled in because `/profile` is the only other stub route in `App.tsx`, and because `User.style_preferences` is an existing, entirely unused `JSONField` that turns the stylist from generic into personal.

## Decisions

**The shop filter moves to a top bar, deviating from the design.** `designs/page-shop` draws a 260px left rail. The app's pitch is that the AI narrows the catalog for you, and a permanent wall of facets contradicts it; a full-width grid also buys larger product photography, which is what sells fashion. The rail was also the smaller problem — `ProductFilter` declares every facet as a single-value `CharFilter`, so Black **and** White is impossible today, there is no ordering parameter, and no counts endpoint exists anywhere.

**One curated photo per product, with gallery views derived as crops of that same photo.** Three different stock photos of "linen trousers" are three different garments — different fabric, model and studio — so a gallery of them claims four views of one item while showing four separate items. Deriving crops from a single photo is the only way to have a gallery that is not lying, and it spends the imgix pipeline that won Unsplash the primary sourcing slot.

**Nothing on these surfaces claims a feature that does not exist.** Three overclaims were cut for the same reason. The home page's AI card promises inspiration-photo upload — there is no image input in `ChatInput`, the API, or the provider calls. The trust bar's "Secure Checkout" is a security assurance about a mock gateway whose `payment_token` *"only picks which way the mock gateway"* goes. The profile callout promises "bespoke lookbooks" and nothing generates one. Note the distinction that survived: "Trending Now" over a rating sort is a *merchandising label*, a stretch nothing the shopper clicks can contradict — not a capability claim.

**Two built features were going unadvertised** and take the vacated trust-bar slots: order tracking (`OrderTracker`, `OrderStatusPill`, `advance_orders` moving real statuses) and the entire wishlist epic. "Free Shipping" turned out to be literally true — `cart_service.calculate_totals` returns `"shipping": Decimal("0.00")`.

**Style preferences steer the stylist but only gender filters retrieval.** A size or budget mismatch is a *caveat* — the item exists and the stylist adds judgement a filter cannot, saying "ideal, but only in L" or "over budget and worth it". Hard-filtering those two deletes most of what a stylist is for. `stock = 0` is different: it is *unavailability*, there is no advice to give, and with `top_k = 5` each unbuyable pick is 20% of a recommendation — so stock filters too.

**No new backend models anywhere in this epic.** Home merchandising binds to filtered `/shop` queries rather than a Collection model. Brand stays a `CharField`. The chat rationale rides on `[[why:id]]` lines that reparse from `ChatMessage.content`, which already persists markers, rather than a through-model on a plain M2M.

**`backdrop-filter` traps `position: fixed`.** An ancestor with `backdrop-filter` creates a containing block, so fixed positioning inside it resolves against that ancestor rather than the viewport. `SiteHeader` already uses `backdrop-blur-md` and 11.6 adds a second blurred bar. Every fixed overlay rendered inside either — the cart drawer, the mobile filter sheet, any future modal — must be portalled to `document.body`. Found by hitting it in 11.6's prototype.

## Open questions

Deliberately unresolved. Each needs something this epic produces before it can be specified.

- **Motion language.** Hover treatments, page transitions, skeleton loaders. Needs 11.1's type and tokens to exist first.
- **Loading, empty and error treatment** across the four surfaces. The existing pages each invented their own; whether this epic unifies them is open.
- **Accessibility pass** on the new chrome — focus order through the filter bar, the picks block, and the retracting header.
- **Hero image LCP.** Every image is now hotlinked cross-origin, and the home hero is on the one page where LCP is the whole first impression. Whether that specific image should be bundled same-origin wants measurement, not a guess.
- **Open Graph and social-preview tags.** The OG image is most likely the home hero, but the crop, dimensions, and whether scrapers accept a hotlinked image are all open.
- **A personalised home page.** Held back because the profile will be empty for almost everyone, which would make the page most people see the untested fallback. Revisit once profiles are populated.

## Out of scope

- **Profile Security & Access** — password change, active sessions with revoke, phone and date of birth. Session tracking is a subsystem, and none of it makes the app more beautiful.
- **`COLLECTIONS` and `ABOUT` routes, and a Collection model.** The home design draws them; this epic binds those tiles to filtered `/shop` queries instead.
- **Hardcoded-hex to token refactor of the nine already-built pages.** A worthwhile cleanup, but maintenance across working code rather than a step toward this destination. It is also why 11.1 stops at colours, fonts and the type scale: declaring `--radius-lg` or `--shadow-md` in `@theme` would silently restyle every `rounded-lg` and `shadow-md` in the app.
- **Inline marker-position chat cards.** Placing each card where its `[[product:id]]` marker sits in the prose would reopen the WebSocket streaming contract, which sends `products` as a separate event after the text. Viable follow-up once 11.11 ships.
- **Conversational write-back of style preferences.** The stylist proposing a preference and the shopper confirming it is the better product and the natural place preferences surface. It needs structured output or tool-calling, which this app has nowhere — the entire AI contract is prose plus text markers. Silent inference was rejected on separate grounds: model output must not mutate stored user data without the user knowing.
- **Guest chat for anonymous visitors.** Letting the landing page demonstrate the stylist rather than describe it is the better home page, but `ChatViewSet` and the consumer are both `IsAuthenticated`, `Conversation` is FK'd to a user, and messages persist per conversation — so it means anonymous sessions, ownership on nothing, throttling with no user, and a merge path at signup.
