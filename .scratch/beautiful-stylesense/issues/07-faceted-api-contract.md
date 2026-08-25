# 07 — Faceted search API contract

Type: grilling
Status: resolved
Blocked by: 03, 06

## Question

What is the exact request and response contract for the faceted product list?

Decide, using the research from ticket 03 and the interaction model from
ticket 06:

- **Parameter encoding** for multi-value facets, and whether existing
  single-value URLs stay valid so shared links do not break. `Products.tsx`
  reads filters straight out of `useSearchParams`, and `FILTER_KEYS` assumes one
  string per key.
- **Facet semantics.** Confirm within-facet OR and across-facet AND, and settle
  price, which is a range rather than a set.
- **Count semantics.** Whether counts reflect the other active filters (so
  selecting Dresses updates the Colour counts) or are computed over the
  unfiltered catalog. This is the decision that determines query cost and
  whether counts can be delivered on the list response or need their own
  endpoint.
- **Response shape.** Whether facets ride on the paginated list response or come
  from a separate `/api/products/facets/` call, and how that interacts with
  `useInfiniteQuery` — which currently flattens pages and would re-receive facet
  data on every page fetch.
- **Sort options.** The allow-list of orderable fields and the label each gets.
  `designs/page-shop` shows "Recommended" as the default, which has no obvious
  backing field; decide what it maps to. `rating` and `created_at` exist.
- **Result count.** `Products.tsx` currently displays `products.length`, which
  is the number *loaded so far*, not the number that match. Decide where the true
  total comes from.
- **Brand facet.** `brand` is an `icontains` filter with no enumeration
  endpoint. Decide whether brands become a real facet, and where the list of
  brands comes from if so.

## Known constraint (surfaced by ticket 03)

- **Cursor pagination collides with a sort control.** `ProductViewSet`
  paginates with `CursorPagination` ordered by `-created_at`. Cursor pagination
  needs a monotonic, effectively-unique ordering field, so exposing `price` or
  `rating` as user-selectable sorts is not simply a matter of adding
  `OrderingFilter`. Decide whether the ordering allow-list gains a unique
  tiebreaker, whether the list view moves to offset pagination, or whether sort
  and infinite scroll are reconciled some other way. Ticket 03 flagged this and
  deliberately did not resolve it.

## Answer

Five decisions, plus three items the earlier tickets had already settled.
Research backing: [`docs/research-faceted-search-django.md`](../../../docs/research-faceted-search-django.md).

### 1. `PageNumberPagination` replaces `CursorPagination`

`ProductPagination` is a `CursorPagination` with `page_size = 12` and
`ordering = "-created_at"`. **Cursor pagination returns no `count`** — that is the
trade it makes by design, not an oversight — and it requires its ordering field
to be monotonic and effectively unique.

Both properties are incompatible with what ticket 06 committed to:

- The bar's result count has no source. `Products.tsx` currently prints
  `products.length`, the number *loaded so far*, so it reads "12 products" until
  Load More is pressed — while the facet block beside it would say `Dresses 6`.
  Two numbers describing the same query, disagreeing, in the same 56px bar.
- A user-selectable `price` sort breaks the monotonic-ordering requirement. This
  is the constraint ticket 03 flagged and deliberately left open.

Cursor pagination earns its keep on large, actively-mutating datasets where
offset pages drift under insertion. This catalog is 50 static rows. It is
retired.

`useInfiniteQuery` and Load More are unaffected — `getNextPageParam` returns
`page + 1` instead of a cursor. As a bonus this makes the numbered pagination in
`designs/page-shop` expressible, which cursor pagination could not do at all.

### 2. Facets ride on the list response

Shape: `{ count, next, previous, results, facets }`.

Ticket 06 renders the result count and the facet counts together in one bar, so
the binding question is whether they can ever disagree. On one payload they
cannot — they are one answer to one query.

The cost is redundancy: page 2 of an infinite scroll carries the same facet block
again, since counts describe the *filter set* rather than the page. Roughly a
kilobyte per Load More.

Rejected: a separate `/api/products/facets/` endpoint. It avoids the redundancy
and introduces two in-flight requests describing two moments — change a filter
and the results and counts can visibly disagree, side by side, in the component
whose whole job is telling the shopper the truth. Also rejected: a `?facets=1`
opt-in, which is the tidy optimisation and adds a param, a branch, and a way to
get it wrong.

Frontend reads them at `data.pages[0].facets`. Mildly awkward, and the
awkwardness is exactly why it is always consistent.

### 3. Sort — `Recommended` means `-rating, -created_at`

Allow-list: `recommended`, `price`, `-price`, `-rating`, `-created_at`. Default
`recommended`.

`designs/page-shop` shows `Sort by: Recommended` and nothing in the schema is
called that, so it had to be bound to something real. `rating` is populated
across all 50 products (3.4–5.0), needs no join, and gives a stable,
unique-enough ordering — which now matters, because a sort field is also a
pagination ordering field.

Rejected: true best-seller popularity annotated from `OrderItem`. The rows exist
and it is computable, but a demo database has almost no orders, so the ordering
would be near-random under a confident label — and it would be worst on the
*default* sort, the one nobody chooses and everybody sees.

Rejected: personalising `Recommended` from ticket 11's profile. It splits the
default sort's meaning by auth state with no visible cause, and smuggles a
personalisation feature into a dropdown.

### 4. Brand is an exact multi-select facet

Values and counts come from decision 2's aggregate pass — no new endpoint, no new
model, no enumeration query. 8 distinct brands over 50 rows.

Two consequences accepted:

- **`icontains` becomes exact.** A facet checkbox is an exact match by
  definition, so `?brand=levi` stops substring-matching. Blast radius is
  hand-typed URLs only: the UI never had a brand control, so nothing in the app
  generates one.
- **Brand stays a `CharField`.** Normalising it to an FK like `Category` is the
  textually correct model and is also a new model, a migration, a data migration,
  and admin — against this map's standing rule. Worth its own cleanup effort
  later, once something needs brand pages.

### 5. Repeated-key parameters

`?color=Black&color=White`, read with `QueryDict.getlist()`, via django-filter's
`BaseInFilter` / `MultipleChoiceFilter`.

**Backward compatibility is free.** Today's `?color=Black` parses to `["Black"]`,
so every existing shared link keeps working with no compatibility shim.

Rejected: CSV (`?color=Black,White`). It is shorter and prettier, and safe *for
this catalog* — every category, gender, colour, size and brand is comma-free.
It is a landmine the day a value contains a comma, and it needs `BaseCSVFilter`
plus hand-written schema hints where repeated keys are handled natively by
django-filter, DRF's browsable API, and OpenAPI generation.

`min_price`, `max_price` and `search` stay single-valued.

Frontend consequence: `filtersFromParams` moves from `params.get` to
`params.getAll`, and `ProductFilters` stops being `Record<string, string>` and
starts holding arrays.

### Already settled elsewhere, recorded here for the implementer

- **Facet semantics** — within-facet OR, across-facet AND. On the JSON array
  columns this means `has_any_keys` (Postgres `?|`), **not** `__contains`.
  Ticket 03 verified that `colors__contains=["Black","White"]` silently means
  AND, because Postgres `@>` requires the left array to contain *all* of the
  right's elements. This is a correctness trap, not a style preference.
- **Count semantics** — counts reflect every *other* active facet, so selecting
  Women updates the Category counts while Gender's own counts hold. One
  `.aggregate()` per facet dimension with `Count("id", filter=Q(...))`. Decided
  in ticket 06 and verified working in its prototype.
- **The image field** — `ProductSerializer` sends no image at all, so the shop
  grid cannot render a photo even with perfect data (ticket 04). The queryset
  **already** does `.prefetch_related("images")`, so the data is fetched and then
  dropped. This is a one-line serializer fix, not a query change.
