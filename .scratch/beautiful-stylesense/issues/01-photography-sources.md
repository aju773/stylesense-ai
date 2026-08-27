# 01 — Fashion photography sources: licensing, hotlinking, stable URLs

Type: research
Status: resolved
Blocked by: —

## Question

Where does editorial fashion photography for 50 catalog products come from, and
what does each candidate source actually permit?

Establish, with primary sources:

- Which free stock libraries carry enough **editorial fashion** imagery to cover
  50 products across the categories in `docs/products.json` (jeans, trousers,
  dresses, outerwear, knitwear, and so on) at a consistent aesthetic. Judge
  Unsplash, Pexels, and any others against catalog breadth, not just quality.
- The **licence terms** for commercial-looking e-commerce use, including whether
  attribution is required and where it must appear.
- The **hotlinking policy** for each: is serving images directly from the
  provider's CDN permitted and rate-limited, or must files be downloaded and
  self-hosted?
- Whether each provider exposes **stable, permanent URLs** for a specific photo,
  and whether those URLs support on-the-fly resizing or format negotiation
  (width, quality, WebP/AVIF).
- The current state of any **API** each offers: authentication, rate limits, and
  whether the endpoints once used for random or keyword-matched images still
  exist. Note explicitly which documented endpoints are deprecated or retired.

Record the findings as a Markdown file in `docs/` and link it from this ticket.

## Answer

Full findings: [`docs/research-product-imagery-sources.md`](../../../docs/research-product-imagery-sources.md)

**Recommendation: Unsplash as primary source, Pexels as gap-filler, skip Pixabay.**

- **Breadth**: not the differentiator. Unsplash and Pexels both return
  thousands of results even for "kurta" (~3.5k / ~4.6k respectively), the
  catalog's least-Western category — so the more common categories (jeans,
  trousers, dresses, jackets, tops, shirts, t-shirts) are covered comfortably
  by both.
- **The deciding fact is hotlinking.** The plan is to hand-map a permanent
  photo URL straight into `ProductImage.image_url` — i.e. hotlink it forever.
  Unsplash's own API Guidelines *require* exactly this ("all API uses must
  use the hotlinked image URLs returned by the API"), Pexels explicitly
  permits it, but **Pixabay's API docs explicitly forbid it** ("permanent
  hotlinking of images... is not allowed") and would force downloading +
  self-hosting all 50 images — out of scope for what was decided. Pixabay is
  out for this reason alone.
- **Unsplash has the only documented on-the-fly resize/format pipeline**:
  imgix query params (`w`, `q`, `fm`, `auto=format`) on a permanent
  `images.unsplash.com` URL, including automatic WebP/AVIF negotiation.
  Pexels's returned URLs carry similar-looking params but resizing-by-editing
  isn't a documented contract, just an observed convention. Pixabay only
  offers four preset widths.
- **Attribution**: neither license *requires* it (Unsplash License, Pexels
  License, Pixabay License all make it optional). The catch: Unsplash's API
  Guidelines layer a *mandatory* attribution requirement on top the moment a
  photo is sourced via their API (not just the manual-download License) — a
  one-time "Photos from Unsplash" credit line satisfies it. Pexels requires
  no attribution even via its API.
- **Verified dead**: the old no-auth `source.unsplash.com` ("Unsplash
  Source") random/keyword endpoint is confirmed retired — deprecated
  2021-11-25, fully sunset starting 2024-06-11, per Unsplash's own
  changelog. Do not use it or any tutorial referencing it; use the
  authenticated `api.unsplash.com` + `images.unsplash.com` pair.
- **Rate limits** are a non-issue for a one-time 50-photo hand-curation pass:
  Unsplash Demo tier alone (50 req/hr) and Pexels (200 req/hr, 20k/mo) both
  comfortably clear it.

Not verifiable from primary sources this pass: Pexels's on-the-fly resize
behavior is inferred from URL convention, not an explicit documented
guarantee; and `help.pexels.com` blocked direct fetches (HTTP 403) this
session, so its content is reconstructed from search-engine-quoted excerpts
rather than a page read directly — flagged in the linked doc for
re-verification if exact wording matters later.
