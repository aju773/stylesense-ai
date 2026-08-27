# 04 — Imagery plan: how images attach to the 50 products

Type: grilling
Status: resolved
Blocked by: 01

## Question

Given the sourcing facts from ticket 01, how does imagery actually attach to
the catalog?

Decide:

- **How many images per product.** `ProductDetail` already renders an
  `ImageGallery` with zoom, so one image per product would leave that component
  showing a gallery of one. Weigh a single hero image against a small set.
- **Which model field carries them.** `Product` itself has no image field —
  `ProductImage` is a separate related table, and `Category.image_url` exists
  but describes a category thumbnail, not a product photo. Decide whether that
  arrangement is fine as-is or needs anything added.
- **Aspect ratio and dimensions.** The shop grid, chat cards, cart line items,
  and the product gallery all crop differently today. Pick one source aspect
  ratio and the crop strategy for each surface. This decision constrains the
  filter-bar and chat-card prototypes downstream.
- **Hosted or hotlinked**, following from ticket 01's licence and hotlink
  findings, and where downloaded files would live if self-hosted.
- **How the mapping is authored and re-runnable.** `docs/products.json` is the
  seed source. Decide whether image assignments live in that file, in a separate
  mapping file, or in a management command, and what happens when the database is
  reseeded.
- **What replaces the gradient fallback**, and whether `getGradient` in
  `frontend/src/lib/product.ts` survives at all once every product has an image.
- **Attribution**, if ticket 01 finds it is required: where credit appears
  without disrupting the Editorial Luxury look.

Also decide the **home page hero image**, which is editorial rather than a
product shot and may need a different source than the catalog.

## Answer

Seven decisions. Sourcing facts from ticket 01:
[`docs/research-product-imagery-sources.md`](../../../docs/research-product-imagery-sources.md).

### Defect found while scouting — the catalog grid cannot show images at all

`ProductSerializer`, which backs the shop list endpoint, sends **no image field**
— not `images`, not `image_url`. And `ProductCard.tsx:63` reads
`product.images?.[0]?.image_url ?? null`, a key that payload never contains, so
it resolves to `null` on every render.

Populating the database perfectly would still leave the shop grid showing
placeholders. Closing this is part of the imagery work, not a separate concern:
the list serializer must carry a primary image URL.

### 1. `ProductImage` is the single source — and already is

**Correction:** the charting session assumed `Product` carried its own
`image_url` field alongside the `ProductImage` table, and treated deleting the
former as a decision. It does not exist — `Product` has no image field of its
own. What actually exists:

| Field | Read by |
| --- | --- |
| `ProductImage` | `ProductDetailSerializer` (gallery), and `ProductCardSerializer.get_image_url()` which picks `is_primary` or falls back to the first row |
| `Category.image_url` | nothing — a category thumbnail, unrelated to product photos, and out of this ticket's scope |
| `OrderItem.image_url` | order-time snapshot, frozen at purchase — a separate concern, untouched |

There is nothing to delete and no migration to write for this decision.
`ProductImage` already feeds every live consumer, and `is_primary` already
provides a hero image without a second field — the question this ticket
answers is how to populate it, not which field wins.

### 2. One photo per product, gallery views derived as crops

`ImageGallery` renders `aspect-[4/5]`, hover-zoom at `scale(2)`, and a
`grid-cols-4` thumbnail row that appears only when `images.length > 1`.

Three *different* stock photos of "linen trousers" are three different garments —
different fabric, different model, different studio. A gallery of them claims
four views of one item while showing four separate items, which is worse than one
honest photo.

So: **one curated photo per product**, with the gallery's additional views
derived from that same photo as imgix crops. The garment is guaranteed identical,
the curation cost stays at 50 photos, and it spends the exact capability that won
Unsplash the primary slot in ticket 01 — a documented `w`/`q`/`fm`/`auto=format`
plus crop pipeline on a permanent URL.

### 3. Source and store at 4:5; the outlier surfaces converge

Measured, the app currently disagrees with itself:

| Surface | Ratio today |
| --- | --- |
| `ImageGallery` main + thumbs | 4:5 |
| `ChatProductStrip` (160×200) | 4:5 |
| `ProductCard` | 3:4 |
| `WishlistCard` | 3:4 |
| `CartLineItem` (100×130) | 10:13 |
| `OrderCard` (72×92) | 18:23 |

All six use `object-cover`, so they silently centre-crop whatever arrives; two
are not even round ratios.

**4:5 wins.** The product page is where cropping hurts most and it is already
4:5, so sourcing at 4:5 means it never crops. The chat cards, which the charting
grill decided to enlarge, are 4:5 too. The other four converge — four class edits.

Rejected: per-surface imgix crop params. Ticket 01 established that Pexels
resize-by-param is observed convention, not a documented contract, and Pexels is
the gap-filler — so that approach would break on an unknown subset of the catalog.

### 4. Authoring — an `images` array in `docs/products.json`

The 50 curated URLs live in `docs/products.json` alongside `sizes` and `colors`,
which are already per-product arrays of the same shape. One file, one command,
one place a product's data lives.

Two facts constrain the seeding path regardless of where the URLs live:
`seed_products.py` creates **no `ProductImage` rows at all** — the table has never
been written to by anything — and its `get_or_create(defaults=...)` skips every
existing product on re-run. So the image path must be idempotent *independently*
of whether the product already exists, or an already-seeded database gets nothing.

Rejected: a slug-keyed second file, which drifts the moment a product is renamed.

### 5. Gradients replaced by a quiet neutral placeholder

The six pastel gradients with a giant brand initial were scaffolding for having
no images at all — loud because they had to fill an entire grid. They do not
disappear when data lands, because two cases keep a fallback alive: hotlinks fail
(the whole strategy points at someone else's CDN permanently), and
`OrderItem.image_url` is a frozen snapshot with `default=""`, so every order
already placed has an empty one.

As a rare error state the fallback should read as intentional, not as six random
pastels. A neutral surface-toned box with a small wordmark replaces it.

Two fixes ride along:

- **`onError` is wired.** Today the fallback triggers only when `image_url` is
  null; a URL that 404s renders a broken-image icon. On a hotlink-everything
  architecture that is the most likely failure mode, and nothing handles it.
- **The duplicate dies.** `getGradient` exists twice — in `lib/product.ts` and
  copy-pasted inside `ImageGallery.tsx`. The replacement lives in one file.

### 6. Attribution — one footer credit line

"Photography from Unsplash & Pexels" in the footer, alongside the copyright.

The licensing position forks on how the photos are found. The Unsplash **License**
(browsing the site, copying a URL) requires no attribution; the Unsplash **API
Guidelines** (sourcing via `api.unsplash.com`) make photographer and Unsplash
attribution mandatory. Pexels requires none either way. A footer line costs one
line and holds whichever way the curation actually happens, so the plan does not
depend on resolving the grey area.

Rejected: photographer bylines on product pages, which break the fiction that
these are the store's own garments — the one place attribution actively hurts.

**Flagged for whoever implements this:** if the curation pass ends up scripted
through the Unsplash **API** rather than hand-browsed, full per-photo attribution
with profile links is the compliant answer, not a single footer line. Confirm the
sourcing method before relying on this decision.

### 7. Home page editorial imagery — curated and hotlinked like the rest

The hero and The Edit's three tiles need non-product imagery. Four more curated
photos, sourced and hotlinked exactly like the catalog's 50, referenced from
frontend constants next to the filtered `/shop` links they sit on.

One strategy for all imagery, responsive sizes for free from the same pipeline,
and no binaries in git. Rejected: a settings row to hold a hero URL, which needs
a model this effort has ruled out; and reusing a product photo as the hero, which
puts a garment shot into a full-body editorial composition it was not shot for.

Cleanup that falls out: `frontend/src/assets/hero.png` is a purple 3D box,
343×361, scaffold art referenced by nothing — the source of the stray `#8900FF`.
It goes, along with `react.svg` and `vite.svg`. `Category.image_url` stays unused,
since The Edit tiles are filtered `/shop` links rather than categories.

The same-origin-versus-hotlinked LCP question for the hero stays as fog on the
map — it wants real numbers, not a guess.
