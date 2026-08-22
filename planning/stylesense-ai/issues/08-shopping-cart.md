# 08 — Shopping Cart (Optimistic UI & Server-Owned Totals)

**What to build:** Users can add products to their bag. The frontend applies changes optimistically for instant UI while syncing with the server in the background; the server owns every total.

**Blocked by:** 04 — Product Detail, 02 — User Authentication

**Status:** done

- [x] Django Cart APIs → 8.1, 8.2
- [x] Cart state with optimistic updates → 8.3 (**TanStack Query, not Redux** — rationale in `progress.md` and `8.3-cart-query-layer.md`)
- [x] Cart Drawer UI and Cart Full Page UI → 8.4 (also built the app's first `SiteHeader`/`AppLayout`)
