# 08 — Home page: what each band binds to

Type: grilling
Status: resolved
Blocked by: 04, 05

## Question

Band by band, what does the home page actually show, and where does every link
go?

`designs/page-home` specifies six bands. Decide the real binding for each,
under the standing constraint that no new backend models are introduced:

- **Hero.** Copy, the image decided in ticket 04, and the two calls to action.
  "Chat with AI Stylist" points at `/chat`, which is behind `ProtectedRoute` —
  decide what an anonymous visitor experiences when they click it.
- **AI stylist pitch** — three feature cards. Decide whether the design's copy
  ships as written or is rewritten to match what the stylist actually does. The
  design promises inspiration-photo upload, which the app does not support.
- **Trending Now** — four products with a "View All" link. Decide the query.
  `rating` exists in the seed data and `created_at` exists on the model; neither
  is trending. Decide what the label honestly means and where "View All" lands.
- **The Edit** — three tiles reading Summer Essentials, New Arrivals, Best
  Sellers. Decide the filtered `/shop` query behind each, whether the labels
  change to match what the data can support, and where their imagery comes from.
- **Trust bar** — four claims: free shipping, AI styling, easy returns, secure
  checkout. Checkout is a mock gateway. Decide which claims ship.
- **Footer** — inherited from ticket 05.

Also decide whether the home page is **identical for anonymous and
authenticated visitors**, or whether a returning user sees something different.

## Answer

Six decisions, band by band.

### 1. Hero — CTA bounces to login and returns

`CHAT WITH AI STYLIST` points at `/chat`, which sits behind `ProtectedRoute`.

The plumbing already exists and is better than the ticket assumed:
`ProtectedRoute` passes `state={{ from: location.pathname }}`, and
`Login.tsx:15` reads it back and calls `navigate(from, { replace: true })`. A
click already bounces to login and returns to `/chat` after sign-in. Nothing to
build.

Rejected: making chat available to anonymous visitors. It is the better landing
page — demonstrating beats describing — and it is an epic. `ChatViewSet` and the
WebSocket consumer are both `IsAuthenticated`, `Conversation` is FK'd to a user,
and `ChatMessage` rows persist per conversation. Guest chat means anonymous
sessions, ownership on nothing, throttling with no user to throttle, and a merge
path at signup. **Recorded as out of scope on the map.**

Rejected: changing the CTA label by auth state, which weakens the page's most
prominent element for no gain.

### 2. AI stylist band — all three cards rewritten

Audited against the app:

| Card | Claim | Reality |
| --- | --- | --- |
| Smart Recommendations | *"analyzes your style history and current trends"* | no style history exists; after ticket 11 there are style **preferences** |
| Natural Conversations | *"or upload an inspiration photo"* | **flatly false** — no image input in `ChatInput`, the API, or the provider calls |
| Instant Comparisons | *"evaluate fabrics, fits, and pricing across multiple brands"* | partly — up to 5 picks across brands with prices; fabric and fit are description boilerplate |

The photo-upload line is the sharpest problem on the page: the most concrete
promise in the band, broken by the first click.

Meanwhile this map has specified three genuinely differentiating capabilities the
design's copy never mentions — **a rationale attached to every pick** (tickets 09
and 10), **preference-aware styling** (ticket 11), and **adding to the bag
without leaving the conversation** (ticket 10). The three cards are rewritten
around those.

Three cards, not two: the count is the band's composition.

### 3. Trending Now — `-rating, -created_at`, top 4

Reuses the exact binding ticket 07 gave `Recommended`, so `VIEW ALL` lands on
`/shop?sort=recommended` and shows **the same ordering continuing** rather than a
different list.

On the label: "nothing on this page lies" was invoked twice above, so the
distinction matters. The photo-upload line was a **capability claim** — the
product either has image input or it does not, and one click settles it.
"Trending Now" over a rating sort is a **merchandising label**: a stretch, not a
falsifiable promise, and nothing the shopper can click contradicts it. Ticket 07
accepted the same reasoning for `Recommended`.

Rejected: a hardcoded list of four slugs, which drifts the moment the catalog
changes.

### 4. The Edit — For Her / For Him / Unisex

Three tiles, three `?gender=` links, zero backend work.

The design's labels do not survive audit. **Summer Essentials** has no season
field behind it. **New Arrivals** is real. **Best Sellers** would have to be
`-rating` — *which is the query Trending Now just took*, putting two bands of
identical products under different labels on one page. That is a visible defect,
not a stretch.

Gender is the first fork a fashion shopper takes, the split is real (Women 22,
Men 14, Unisex 14), and it is the axis ticket 11 turned into a stored preference
— so the tiles and the stylist agree about what matters. It also gives ticket
04's three curated editorial photos an obvious brief.

Rejected: an "On Sale" tile. `discount_price` exists but `ProductFilter` has no
filter for it — only min/max price — so it needs a new param.

### 5. Trust bar — four tiles, all true

Audit found the charting grill's assumption wrong. Half the band is real:

| Claim | Reality |
| --- | --- |
| Free Shipping | **true** — `cart_service.calculate_totals` returns `"shipping": Decimal("0.00")` |
| AI Styling | true |
| Easy Returns | nothing — no model, no endpoint, no UI |
| Secure Checkout | `payment_token` *"only picks which way the mock gateway"* goes |

"Secure Checkout" is the one claim where being wrong is not a stretch but a
misrepresentation — a security assurance about a mock payment path.

Two fully-built capabilities were going unmentioned: **order tracking**
(`OrderTracker`, `OrderStatusPill`, and an `advance_orders` command moving real
statuses) and the **wishlist**, an entire shipped epic.

Final four: **Free Shipping · AI Styling · Order Tracking · Save & Compare.**
Composition preserved, every tile true, and two real features advertised for the
first time.

### 6. One page for everyone

The home page renders identically for anonymous and authenticated visitors.

Ticket 11 established the profile will be empty for almost everyone, so
personalisation would make the page most people see the *fallback* — designed
second, tested least. Ticket 07 already rejected this same shape for the default
sort, on the grounds that it changes what something means with no visible cause.
And decision 1 already handles the returning visitor: an authenticated user
clicking the hero CTA simply goes straight through.

A personalised home page is the more interesting version and belongs to a future
effort with a populated profile behind it. **Recorded as fog on the map**, not
built on an empty `{}`.
