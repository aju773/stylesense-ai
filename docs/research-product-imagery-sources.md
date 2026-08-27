# Research: Free Stock Photography Sources for Product Imagery (Unsplash, Pexels, Pixabay)

> **Correction, added after this doc was written:** the brief for this research
> assumed the app stores a product's photo URL in `Product.image_url`. That
> field does not exist — the app stores it in a related `ProductImage` table
> instead. Every reference to `Product.image_url` below should be read as
> `ProductImage.image_url`. It does not change any conclusion: hotlinking a
> permanent URL forever is exactly the same act regardless of which table
> column holds it, so the Pixabay/Unsplash/Pexels findings stand unaltered.

## Primary Sources & Documentation
- **Unsplash License**: [unsplash.com/license](https://unsplash.com/license)
- **Unsplash API Documentation**: [unsplash.com/documentation](https://unsplash.com/documentation)
- **Unsplash API Guidelines**: [help.unsplash.com/en/articles/2511245-unsplash-api-guidelines](https://help.unsplash.com/en/articles/2511245-unsplash-api-guidelines)
- **Unsplash Guideline: Attribution**: [help.unsplash.com/en/articles/2511315-guideline-attribution](https://help.unsplash.com/en/articles/2511315-guideline-attribution)
- **Unsplash Guideline: Hotlinking Images**: [help.unsplash.com/en/articles/2511271-guideline-hotlinking-images](https://help.unsplash.com/en/articles/2511271-guideline-hotlinking-images)
- **Unsplash API Changelog** (source.unsplash.com deprecation/sunset): [unsplash.com/documentation/changelog](https://unsplash.com/documentation/changelog)
- **Pexels License**: [pexels.com/license](https://www.pexels.com/license/)
- **Pexels API Documentation**: [pexels.com/api/documentation](https://www.pexels.com/api/documentation/)
- **Pexels API Guidelines and FAQ** (help center, quoted via search — direct fetch blocked by Cloudflare, see note below): [help.pexels.com/hc/en-us/articles/900004848223](https://help.pexels.com/hc/en-us/articles/900004848223-Pexels-API-Guidelines-and-FAQ)
- **Pixabay Content License**: [pixabay.com/service/license](https://pixabay.com/service/license/)
- **Pixabay API Documentation**: [pixabay.com/api/docs](https://pixabay.com/api/docs/)

**Note on source access**: `help.pexels.com` returned HTTP 403 to direct fetches in this session (Cloudflare bot-protection blocking the fetch tool's user agent), so its content below is reconstructed from verbatim quotes surfaced by web search against that same domain, not a raw page fetch. Everything from `unsplash.com`, `pexels.com` (apex domain), and `pixabay.com` was fetched directly. Flagged inline wherever confidence is lower than "read it myself."

---

## 1. Catalog shape (what needs covering)

From `docs/products.json` (50 products):

| Category | Count |
|---|---|
| Jeans | 8 |
| Trousers | 8 |
| Kurtas | 8 |
| Tops | 7 |
| Dresses | 6 |
| Jackets | 5 |
| Shirts | 4 |
| T-Shirts | 4 |

Gender split: Women 22, Men 14, Unisex 14. Notably, **Kurtas** (South Asian tunic) is 16% of the catalog — a category Western stock libraries tag less consistently than jeans/dresses/jackets, so it's the coverage risk to check explicitly, not an afterthought.

---

## 2. Breadth: does each library carry enough editorial fashion imagery?

Spot-checked via each site's own search UI (result counts as reported by the page itself, not the API):

- **Unsplash**: searching `kurta` returns **~3.5k** photo results ([unsplash.com/s/photos/kurta](https://unsplash.com/s/photos/kurta)).
- **Pexels**: searching `kurta` returns **~4.6k** photo results ([pexels.com/search/kurta](https://www.pexels.com/search/kurta/)).
- **Pixabay**: has a dedicated `fashion` category in its API's category taxonomy alongside backgrounds, people, places, etc. ([pixabay.com/api/docs](https://pixabay.com/api/docs/)), confirming fashion is a first-class content bucket, though average editorial/production quality on Pixabay skews more amateur/stock-generic than Unsplash or Pexels (general knowledge from browsing the platforms, not a documented claim — flagged as such).

Both Unsplash and Pexels return thousands of results even for a narrower, non-Western search term like "kurta," which is a strong signal that the more common categories (jeans, trousers, dresses, jackets, tops, shirts, t-shirts) are covered far more deeply. **Breadth is not the differentiator between Unsplash and Pexels** — both are viable on catalog coverage. The differentiator is licensing/hotlinking mechanics (below).

Caveat: these are fuzzy tag/caption-match counts, not a guarantee that 8 *stylistically consistent, editorial-quality* kurta photos exist within that pool — that requires manual curation, which is explicitly the team's plan (hand-mapping), so this is treated as adequate signal rather than proof.

---

## 3. Licence terms for commercial e-commerce use

### Unsplash License ([unsplash.com/license](https://unsplash.com/license))
- Commercial use permitted: "download, copy, modify, distribute, perform, and use images from Unsplash for free, including for commercial purposes," with no permission needed.
- **Attribution under the License itself is not required** ("though attribution is appreciated"). Recommended format if given: "Photo by [Name] on Unsplash."
- Restrictions: cannot sell unaltered copies; cannot compile Unsplash photos "to replicate a similar or competing service."
- **Important layering**: this is the license for using a downloaded photo. If the photo is instead sourced *via the Unsplash API*, a separate, stricter contract applies — see §4 and §6.

### Pexels License ([pexels.com/license](https://www.pexels.com/license/))
- Commercial use permitted for websites, e-commerce, marketing, print, social.
- **Attribution is optional, full stop** — "not required," "not necessary but always appreciated," including for API use per Pexels's own FAQ (see §6).
- Restrictions: cannot sell unaltered copies standalone; cannot redistribute on other stock/wallpaper platforms; cannot use as a trademark/business name/service mark; cannot imply brand/person endorsement.

### Pixabay Content License ([pixabay.com/service/license](https://pixabay.com/service/license/))
- Commercial use permitted, with attribution optional/appreciated only.
- Restrictions: cannot sell unmodified content standalone; cannot use content containing recognizable trademarks/brands/logos for commercial goods; no immoral/illegal/deceptive use.

**Bottom line**: none of the three legally requires attribution to *appear on the storefront* under their base license. Unsplash is the one exception where attribution becomes mandatory the moment the photo is obtained through its API rather than a manual download (next section).

---

## 4. Hotlinking policy

This is where the three providers diverge sharply — and it's the fact that most constrains the implementation.

### Unsplash: hotlinking is *required*, not merely allowed
Per Unsplash's own API Guidelines ([help.unsplash.com/en/articles/2511245](https://help.unsplash.com/en/articles/2511245-unsplash-api-guidelines)) and the dedicated hotlinking guideline ([help.unsplash.com/en/articles/2511271](https://help.unsplash.com/en/articles/2511271-guideline-hotlinking-images)):

> "All API uses must use the hotlinked image URLs returned by the API under the `photo.urls` properties" — and this "applies to all uses of the image and not just search results."

Consequence: if the photo URLs are obtained via the Unsplash API, the app is contractually required to keep serving `images.unsplash.com` URLs directly (not download + self-host) — Unsplash tracks views/downloads through that pathway to credit photographers. Self-hosting Unsplash-API-sourced images is a guideline violation, not just a style choice.

### Pexels: hotlinking explicitly permitted, caching also explicitly endorsed
Pexels's API Guidelines & FAQ state applications *can* cache API responses ("24 hours being a good amount of time to cache responses for, as URLs to content returned from the API should not change over the short term") and there is no prohibition on hotlinking `images.pexels.com` URLs directly — it is the normal usage pattern in Pexels's own documentation examples. (Sourced via search-engine quoting of `help.pexels.com`, not a direct fetch — see access note above.)

### Pixabay: hotlinking explicitly *prohibited*
Per Pixabay's own API docs ([pixabay.com/api/docs](https://pixabay.com/api/docs/)):

> "Permanent hotlinking of images (using Pixabay URLs in your app) is not allowed."

Consequence: Pixabay requires downloading and self-hosting every image used, plus caching API JSON responses for 24 hours. This is meaningfully more implementation overhead than Unsplash or Pexels for this ticket's use case.

---

## 5. Stable permanent per-photo URLs and on-the-fly resize/format negotiation

### Unsplash
`images.unsplash.com` URLs are permanent per-photo and backed by **imgix**, with documented query parameters ([unsplash.com/documentation](https://unsplash.com/documentation)):
- `w`, `h` — width/height
- `q` — compression quality
- `fm` — explicit format conversion (supports modern formats)
- `auto=format` — content-negotiated best format (serves WebP/AVIF to supporting clients automatically)
- `crop`, `fit`, `dpr` — cropping and device-pixel-ratio variants

This is a genuine, documented, flexible resize/format pipeline — arbitrary width and automatic modern-format negotiation are first-class, supported query parameters, not an inferred convention.

### Pexels
The API returns a `src` object per photo with a fixed set of pre-generated sizes (`original`, `large2x`, `large`, `medium`, `small`, `portrait`, `landscape`, `tiny`) built on `images.pexels.com`. These URLs carry query parameters (`auto=compress`, `cs=tinysrgb`, `w`, `h`, `dpr`, `fit`) that, going by the URL patterns Pexels itself returns and uses across its documentation/examples, can be edited to request other widths/heights. **This is not spelled out in the API docs as a formal, guaranteed contract** ("pass any width you like") — it's a de facto convention observed in the returned URL structure, so treat it as "probably works, not officially promised" rather than Unsplash's explicitly documented imgix parameter set.

### Pixabay
The `webformatURL` only supports swapping a fixed size suffix (`_180`, `_340`, `_640`, `_960`) — a small enum of preset widths, not continuous/arbitrary resizing. `largeImageURL` gives a bigger fixed size. No format-negotiation parameters are documented.

**Ranking on this axis: Unsplash > Pexels > Pixabay.** Unsplash is the only one of the three with a documented, general-purpose image-transformation API (imgix) attached to permanent URLs.

---

## 6. Current API state: auth, rate limits, deprecated endpoints

### Unsplash ([unsplash.com/documentation](https://unsplash.com/documentation))
- Auth: `Authorization: Client-ID YOUR_ACCESS_KEY` header (or `client_id` query param) for public actions; full OAuth for user-scoped actions.
- Rate limits: **50 requests/hour** in Demo mode (default for new apps); **1000 requests/hour** in Production mode, which requires Unsplash's approval of the application against its API Guidelines. Only calls to `api.unsplash.com` (JSON) count against the limit — requests to `images.unsplash.com` (the actual image bytes) do not.
- Live endpoints: `GET /search/photos`, `GET /photos/random`, `GET /photos/:id`, `GET /photos`.
- **Deprecated/retired endpoint — CONFIRMED DEAD**: "Unsplash Source" (`source.unsplash.com`), the old no-auth random/keyword-redirect image endpoint, per Unsplash's own changelog ([unsplash.com/documentation/changelog](https://unsplash.com/documentation/changelog)):
  - Deprecated **November 25, 2021**: "Unsplash Source is being deprecated. Existing uses will continue to work, however for new projects use the full Unsplash API."
  - Fully sunset starting **June 11, 2024**: "Unsplash Source has been officially unsupported since its deprecation in 2021. As part of the final sunsetting, we will first wind down by disabling the search feature, and in the coming weeks turn off the application entirely."
  - **Verified: `source.unsplash.com` is dead. Do not use it, and disregard any tutorial or blog post — including anything in this project's own institutional memory — that references it.** Use the authenticated `api.unsplash.com` + `images.unsplash.com` pair instead.
- Attribution is a hard requirement for any API-sourced photo (see §3/§4) — a legal-license nicety becomes a contractual API obligation the moment the Unsplash API is the acquisition path.

### Pexels ([pexels.com/api/documentation](https://www.pexels.com/api/documentation/))
- Auth: API key via `Authorization` header, obtained instantly after account creation.
- Rate limits: **200 requests/hour, 20,000 requests/month** by default, surfaced via `X-Ratelimit-*` response headers. Higher/unlimited limits available on request if the app demonstrates proper attribution.
- Endpoints: `GET /v1/search`, `GET /v1/curated`, `GET /v1/photos/:id` (plus `/v1/videos/*` equivalents).
- No evidence found of any deprecated/retired Pexels photo endpoint.

### Pixabay ([pixabay.com/api/docs](https://pixabay.com/api/docs/))
- Auth: API key, obtained after login.
- Rate limits: 100 requests/60 seconds by default, with a documented *requirement* (not just suggestion) to cache results for 24 hours.
- Endpoints: `GET /api/` (images), `GET /api/videos/`.
- Hotlinking explicitly disallowed (§4) — a structural mismatch with "put a CDN URL straight in `Product.image_url`."

---

## 7. Recommendation

**Primary: Unsplash. Secondary/gap-filler: Pexels. Avoid Pixabay for this ticket.**

Reasoning, tied to the constraint that actually matters most here — the team plans to **hand-map** 50 permanent photo URLs directly into `Product.image_url`, not make live per-request API calls at runtime:

1. **Hotlinking is the deciding fact.** Storing a picked photo's CDN URL directly in `Product.image_url` and letting `<img src>` load it forever *is* hotlinking. Pixabay's API terms explicitly forbid exactly that ("permanent hotlinking... is not allowed") — using Pixabay as designed would force downloading and self-hosting 50 images, which is out of scope for what the team decided. Unsplash not only permits this pattern via its API, it *requires* it — so the simplest possible implementation (store the CDN URL, done) is also the compliant one. Pexels permits it too, with even fewer strings attached.
2. **Unsplash has the only documented, general on-the-fly resize/format pipeline** (imgix `w`/`q`/`fm`/`auto=format` on a permanent URL). Given the "Editorial Luxury" design system's Retina-conscious, high-production card grid, being able to request `?w=800&auto=format&q=80` per breakpoint without re-curating images is a real advantage over Pexels's fixed-size-with-editable-but-undocumented query params, and a decisive advantage over Pixabay's four-preset-width scheme.
3. **Breadth is comparable** (§2) — both Unsplash and Pexels return thousands of results even for the catalog's least-Western category (kurtas), so neither is the bottleneck; this doesn't favor either provider strongly.
4. **The cost of Unsplash's one real strings-attached term — mandatory attribution when API-sourced — is small and one-time**: a "Photos from Unsplash" credit line (or per-photographer credits, ideally on a photo-detail context) satisfies the requirement, and is far cheaper than Pixabay's self-hosting obligation.
5. **Use Pexels as the fallback** for any of the 50 products where curation can't find a suitably editorial, on-brand Unsplash photo (Pexels's zero-attribution-required license makes individual substitutions frictionless, and its breadth is at least as good per the kurta spot-check).
6. **Do not use the old Unsplash Source endpoint** (`source.unsplash.com`) under any circumstances — it is fully retired as of mid-2024 (§6), confirmed from Unsplash's own changelog. Use the authenticated Unsplash API (`api.unsplash.com` for search, `images.unsplash.com` for the permanent, parameterized image URL) instead.

### Open items not resolvable from primary sources in this pass
- Pexels's on-the-fly resize behavior (§5) is inferred from URL conventions across Pexels's own docs/examples, not from an explicit "pass any width" guarantee in the API reference text — treat as likely-safe, not contractually guaranteed.
- `help.pexels.com` blocked direct fetches in this session (HTTP 403, likely bot-protection); its content here is reconstructed from search-engine-quoted excerpts of that same domain rather than a page I read directly. If precision on Pexels's exact API-guideline wording matters later, re-verify by opening `help.pexels.com/hc/en-us/articles/900004848223-Pexels-API-Guidelines-and-FAQ` in an authenticated/human browser session.
- Actual per-category photo *quality/consistency* (does a curator find 8 genuinely on-brand "Editorial Luxury" kurta shots, not just 8 photos tagged "kurta") cannot be verified without doing the hand-curation itself — this document establishes that the *pool* is large enough, not that the curation will be effortless.
