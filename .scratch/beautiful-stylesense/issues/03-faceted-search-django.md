# 03 — Faceted search in django-filter and DRF: multi-value params and counts

Type: research
Status: resolved
Blocked by: —

## Question

What are the established patterns for multi-select filters, facet counts, and
sorting on a DRF list endpoint backed by django-filter?

Current state: `backend/apps/products/filters.py` declares every facet as a
single-value `CharFilter`. `color` and `size` are JSON array fields filtered
with `__contains=[value]`. There is no ordering parameter and no counts
endpoint.

Establish, with primary sources:

- How django-filter expresses **multi-value parameters** — `BaseInFilter`,
  `MultipleChoiceFilter`, and `filters.BaseCSVFilter` — and the query-string
  encoding each expects (`?color=Black&color=White` versus `?color=Black,White`).
  Note which encoding DRF's browsable API and OpenAPI schema generation handle
  cleanly.
- How to apply the same to a **JSONField array column** in Postgres, where the
  semantics are "product has any of these sizes" rather than an exact match.
  Cover the relevant `__contains` / `__overlap` lookups and whether
  `django.contrib.postgres.fields.ArrayField` lookups apply to `JSONField`.
- How **within-facet OR, across-facet AND** is normally implemented — the
  standard e-commerce faceting semantic — and what that means for building the
  queryset.
- How to compute **facet counts** in Django: aggregation with `Count`,
  conditional aggregation with `Case`/`When` or `filter=Q(...)`, and how many
  queries a full facet-count payload costs. Cover whether counts should reflect
  the other active filters, and what the query strategy is for each answer.
- How DRF's **`OrderingFilter`** works, how to restrict it to a safe allow-list
  of fields, and how to expose a default ordering.

Record the findings as a Markdown file in `docs/` and link it from this ticket.

## Answer

Installed versions (from `backend/uv.lock`): Django 6.0.7, django-filter 26.1, DRF 3.17.1.
`REST_FRAMEWORK["DEFAULT_FILTER_BACKENDS"]` currently wires only `DjangoFilterBackend` — no
`OrderingFilter` yet.

**Multi-value encoding**: use repeated query keys — `?color=Black&color=White` — read via
`self.data.getlist("color")` inside a `CharFilter(method=...)` (or via `MultipleChoiceFilter`, which
uses this encoding natively through its `SelectMultiple` widget). This is the encoding DRF's browsable
API renders most legibly and the one `MultipleChoiceFilter` itself standardizes on. `BaseCSVFilter`
(comma-separated, single key) is the documented alternative — simpler for OpenAPI schema generation as
a plain string param, but django-filter's own multi-value idiom is the repeated-key form.

**JSON array lookup — the sharp finding**: `colors`/`sizes` are plain `models.JSONField`, not
`django.contrib.postgres.fields.ArrayField`, so `ArrayField`'s `__overlap` lookup **does not exist** on
them at all — that's Postgres `array`-type-only, confirmed in the Django `ArrayField` docs. And the
lookup already in use, `__contains` (→ Postgres `@>`), is **AND semantics** for multi-element arrays,
confirmed word-for-word from the PostgreSQL docs (`[1,2,3] @> [1,3]` is a "does left contain all of
right" test) — so extending today's `colors__contains=[value]` to `colors__contains=["Black","White"]`
would silently require *both* colors, not either, which is a real bug, not just a style question. The
correct lookup is `has_any_keys`, which Django's source (`django/db/models/fields/json.py`) shows
compiles to Postgres's `?|` operator — and PostgreSQL defines `?|` explicitly over "top-level keys **or
array elements**", so `sizes__has_any_keys=["S","M"]` gives exactly "has S or M" on a flat JSON string
array. Caveat: this only matches string elements (matches how `colors`/`sizes` are actually populated
here; would misbehave silently on non-string elements, per Django's own "any string could be a key, no
errors are raised" warning on JSONField lookups).

**Within-facet OR / across-facet AND**: falls out for free from how `FilterSet` works — each declared
filter's method further narrows (`.filter()`-chains, i.e. AND) the queryset handed to the next one; OR
is built explicitly inside one filter's method body (`has_any_keys=values` for JSON-array facets,
`field__in=values` for scalar facets). No special orchestration needed.

**Facet counts**: one `.aggregate()` call per facet *dimension* (not per value) using
`Count("id", filter=Q(...))` for each possible value — e.g. all size counts in one query. Five facet
dimensions (category, gender, brand, color, size) → five queries total for a full payload, independent
of catalog size (trivial at 50 rows either way). The well-known Django "combining multiple aggregations
yields wrong results" join-multiplication trap (documented for `annotate()` + to-many relations) does
**not** apply here — this pattern uses `.aggregate()`, not `.annotate()`, and every conditional `Count`
targets `id` on the same `Product` row with no join fan-out, since `colors`/`sizes` are JSONField
columns on `Product` itself. Recommend counts reflect all *other* active filters excluding the facet's
own filter (standard e-commerce convention, avoids counts collapsing to zero as the user narrows) — same
query cost as the naive "count against the fully filtered set" alternative, just built from an
"everything-except-this-facet" queryset per dimension.

**Ordering**: add `rest_framework.filters.OrderingFilter` to `filter_backends`, set `ordering_fields`
to an explicit allow-list (DRF's docs explicitly warn against leaving it unrestricted — "prevent
unexpected data leakage... against a password hash field or other sensitive data"), and set
`ordering = [...]` for the default. Flag for implementation: `ProductViewSet` uses `CursorPagination`
with `ordering = "-created_at"`, which needs a monotonic, effectively-unique ordering field for stable
cursors — allowing `?ordering=price` (non-unique, has ties) needs a secondary tiebreaker or it can
misbehave across pages. Not resolved by this ticket; flagged for the implementing ticket.

Full findings, primary-source quotes, and code examples: `docs/research-faceted-search-django.md`.
