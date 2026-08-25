# Faceted Search in django-filter + DRF: Multi-Value Params, JSON Array Facets, Counts, Ordering

## Executive Summary

Confirmed installed versions (from `backend/uv.lock` / `backend/pyproject.toml`): **Django 6.0.7**,
**django-filter 26.1**, **djangorestframework 3.17.1**. `REST_FRAMEWORK["DEFAULT_FILTER_BACKENDS"]`
in `backend/core/settings/base.py` is already `["django_filters.rest_framework.DjangoFilterBackend"]`
only — no `OrderingFilter` or `SearchFilter` is wired in yet.

The current `backend/apps/products/filters.py` treats every facet (`category`, `gender`, `brand`,
`color`, `size`) as single-value. `Product.colors` and `Product.sizes` are plain `models.JSONField`
(not `django.contrib.postgres.fields.ArrayField`) storing JSON arrays of strings, filtered today with
`colors__contains=[value]` / `sizes__contains=[value]`.

**The sharpest finding**: on a `JSONField`, `__contains` compiles to PostgreSQL's `@>` (jsonb
containment) operator. For JSON *arrays*, `@>` requires the left array to contain **every** element of
the right array (AND semantics) — confirmed directly against the PostgreSQL docs' array-containment
examples. So `sizes__contains=["S", "M"]` would ask "has both S and M", which is the *wrong* semantic
for "has S or M". The correct multi-value, OR-within-a-JSON-array lookup is `has_any_keys`, which
Django compiles to Postgres's `?|` operator — an operator the Postgres docs explicitly define over
"top-level keys **or array elements**". This is verified from Django's own source
(`django/db/models/fields/json.py`) and the PostgreSQL documentation, not inferred.

Recommendation, in one line: encode multi-value facets as repeated query keys (`?color=Black&color=White`),
parse them with a `django_filters.CharFilter`/custom `Filter` (or `MultipleChoiceFilter`) that calls
`sizes__has_any_keys=values` for JSON-array facets and `Q(...) | Q(...)` chains or `field__in=values`
for scalar facets, AND the per-facet querysets together, compute facet counts with one `.aggregate()`
call per facet dimension using `Count("id", filter=Q(...))`, and add DRF's `OrderingFilter` with an
explicit `ordering_fields` allow-list and a `ordering = ["-created_at"]`/`["-rating"]` default.

---

## 1. Multi-value parameters in django-filter

Primary source: django-filter's filter reference (`https://django-filter.readthedocs.io/en/stable/ref/filters.html`)
and the `django_filters/filters.py` / `django_filters/widgets.py` source on GitHub
(`carltongibson/django-filter`, `main` branch, fetched directly).

### `MultipleChoiceFilter`
- Backed by Django's `forms.MultipleChoiceField`, whose default widget is `SelectMultiple`.
- Query-string encoding: **repeated keys with the same name** — `?status=Regular&status=Admin`.
  This is standard Django forms behavior: a multi-select widget's `value_from_datadict` calls
  `QueryDict.getlist(name)`, which is exactly what `?key=a&key=b` produces.
- Docs, quoted: *"Multiple choices are represented in the query string by reusing the same key with
  different values."* Default logic is **OR**; pass `conjoined=True` for AND. `distinct` defaults to
  `True` (relevant for to-many relations, not needed here since `colors`/`sizes` are JSON columns on
  the `Product` row itself, not a related table).
- Requires an explicit `choices=` list — natural fit for `gender` (already has `GENDER_CHOICES` on the
  model) but awkward for `color`/`size`/`brand`, which aren't enumerated in Python; you'd have to fetch
  distinct values at import time or accept free-form input via a different filter class.

### `BaseInFilter` / `BaseCSVFilter`
- `BaseCSVFilter` docstring (source): *"Base class for CSV type filters, such as IN and RANGE."* It
  builds a concrete form field by mixing `BaseCSVField` into whatever `field_class` you give it, and
  widget resolution defers to that field.
- `BaseInFilter` = `BaseCSVFilter` + `lookup_expr="in"` by default. Docs: *"It is expected that this
  filter class is used in conjunction with another filter."* Standard idiom:
  ```python
  class NumberInFilter(django_filters.BaseInFilter, django_filters.NumberFilter):
      pass
  ```
- Query-string encoding: **a single key with comma-separated values** — `?id__in=1,3` /
  `?color=Black,White`. The widget chain is `CSVWidget(BaseCSVWidget, forms.TextInput)` — confirmed
  from `django_filters/widgets.py` source — whose `value_from_datadict` does
  `value.split(",")` on the single string it receives.
- Because the underlying form widget is a plain `TextInput`, DRF's **browsable API** renders it as one
  free-text box where the user types `Black,White` by hand — there is no native multi-select UI for
  CSV filters, unlike `MultipleChoiceFilter`'s `SelectMultiple`. For **OpenAPI/schema generation**
  (e.g. `drf-spectacular` introspecting the `FilterSet`), a CSV filter is described as a single
  `string` query parameter — clean and simple to document (`?color=Black,White`) — whereas a
  `MultipleChoiceFilter`'s repeated-key encoding needs `explode: true` / `style: form` array-parameter
  semantics to represent correctly in OpenAPI 3, which schema generators handle with more friction and
  which isn't remotely as visible in Swagger UI's default form (repeated identical-name inputs).

### Which encoding to use here
Given `color` and `size` values are open-ended strings (not a fixed Python-side choice list) and the
catalog is tiny, a **`CharFilter` with a `method=`** callable (the pattern already used in this repo for
`filter_color`/`filter_size`) that manually splits `request.query_params.getlist("color")` — i.e.
**repeated-key encoding**, `?color=Black&color=White` — is the best fit: it doesn't need enumerated
`choices=`, it matches `MultipleChoiceFilter`'s well-documented OR default, and it's the encoding DRF's
browsable API renders most legibly for a small, ad-hoc value set (a multi-select isn't populated
without a fixed choice list anyway, so browsable-API ergonomics are roughly a wash — but repeated-key is
the more RESTful/self-describing convention and is what `MultipleChoiceFilter` itself standardizes on).
Comma-separated (`BaseCSVFilter`) is the documented alternative if a single flat query string is
preferred; both are legitimate django-filter idioms — this is a choice, not a correctness issue.

---

## 2. Applying this to a `JSONField` array column (the sharp question)

Primary sources: Django's JSONField query docs
(`https://docs.djangoproject.com/en/6.0/topics/db/queries/#querying-jsonfield`), Django's
`django.contrib.postgres` `ArrayField` docs
(`https://docs.djangoproject.com/en/6.0/ref/contrib/postgres/fields/#querying-arrayfield`), Django's
source (`django/db/models/fields/json.py`, `main` branch), and PostgreSQL's own JSON docs
(`https://www.postgresql.org/docs/current/datatype-json.html`, §8.14.3 jsonb Containment and Existence).

### `colors` / `sizes` are `JSONField`, NOT `ArrayField` — this matters

`Product.sizes` and `Product.colors` are declared as `models.JSONField(default=list)`
(`backend/apps/products/models.py:34-35`), **not**
`django.contrib.postgres.fields.ArrayField`. This is a real constraint:

> `ArrayField` lookups — `contains` (`@>`, subset test), `contained_by` (`<@`), **`overlap`** (`&&`,
> "shares any element"), `len`, index (`tags__0=`) and slice (`tags__0_1=`) transforms — **are only
> available on `django.contrib.postgres.fields.ArrayField`**. They are Postgres `array` type
> operators/functions and do not exist on plain `JSONField`, whose values are stored as `jsonb`, a
> different Postgres type with its own operator set.

So **`__overlap` is not usable here at all** — it's not a JSONField lookup. (If the schema were changed
to a real `ArrayField(models.CharField())`, `sizes__overlap=["S", "M"]` would be the exact, correct,
one-line OR-membership query — worth flagging as the cleaner long-term fix, but out of scope for this
research ticket, which is about the current `JSONField` schema.)

### What `JSONField.__contains` actually does, and why it's wrong for multi-value OR

Django's JSONField `contains` lookup (`DataContains` in `json.py`, `postgres_operator = "@>"`) compiles
straight to Postgres's jsonb `@>` containment operator. PostgreSQL's own docs (§8.14.3) give the exact
semantics with worked examples:

> `SELECT '[1, 2, 3]'::jsonb @> '[1, 3]'::jsonb;` → **true** (values on the right are a subset of the
> left) ... "The general principle is that the contained object must match the containing object as to
> structure and data contents ... the order of array elements is not significant when doing a
> containment match, and duplicate array elements are effectively considered only once."

That means `@>` (and therefore `__contains`) tests **"left array contains ALL of these values"** — it
is an AND test over the values you pass, not OR. This is exactly why the existing code only ever calls
`colors__contains=[value]` with a **single-element list**: `["Black"]` reduces the AND-of-one down to
"contains Black", which happens to be correct only because it's degenerate (one element). Naively
extending it to `colors__contains=["Black", "White"]` to mean "Black or White" would silently return
**products that have both colors**, not either — a real correctness bug, not just a style nit.

### The correct lookup: `has_any_keys` → Postgres `?|`

Django's `HasAnyKeys` lookup (source, `json.py`):

```python
class HasKeys(HasKeyLookup):
    lookup_name = "has_keys"
    postgres_operator = "?&"
    logical_operator = " AND "

class HasAnyKeys(HasKeys):
    lookup_name = "has_any_keys"
    postgres_operator = "?|"
    logical_operator = " OR "
```

Django's docs describe `has_any_keys` in dict terms ("Returns objects where any of the given keys are
in the top-level of the data") because its worked example uses dict data. But it compiles directly to
Postgres's `?|` operator, and the **Postgres operator docs** define `?|` independent of JSON shape:

> `jsonb ?| text[] → boolean` — "Do any of the strings in the text array exist as top-level keys **or
> array elements**?" Example: `'{"a":1, "b":2, "c":3}'::jsonb ?| array['b', 'd']` → `t`.

The `?` (singular) existence operator is documented the same way — `'["foo", "bar", "baz"]'::jsonb ?
'bar'` → true, i.e. it matches array elements, not only dict keys. Since `Product.sizes`/`colors` store
flat JSON arrays of strings (e.g. `["S", "M", "L"]`), `has_any_keys` is exactly the right tool:

```python
Product.objects.filter(sizes__has_any_keys=["S", "M"])   # sizes has "S" OR "M" (or both)
Product.objects.filter(colors__has_key="Black")           # single value, still correct
```

`has_keys` (`?&`, AND-of-all) is available too if a "must have every one of these sizes" semantic were
ever wanted, but that is not the standard e-commerce facet semantic (see §3).

**Caveat worth stating plainly, since it wasn't fully resolved by docs alone**: `has_key`/`has_keys`/
`has_any_keys` match **string** values structurally the same way the `?`/`?|`/`?&` Postgres operators
do (they test JSON string scalars/array elements/object keys, not numbers or nested objects). Every
value in `colors`/`sizes` here is a plain string, so this is not a problem for this schema, but it would
misbehave silently if a non-string element were ever stored in the array (matching Django's own general
warning on the JSONField page: *"Since any string could be a key in a JSON object, any lookup other
than those listed below will be interpreted as a key lookup. No errors are raised."* — i.e. there is no
schema validation catching a mismatch here; be deliberate about only ever storing strings in these two
columns).

### Recommended filter implementation

```python
# backend/apps/products/filters.py (illustrative — do not apply, this is a research ticket)
import django_filters
from django.db.models import Q

from .models import Product


class ProductFilter(django_filters.FilterSet):
    category = django_filters.CharFilter(field_name="category__slug", lookup_expr="exact")
    gender = django_filters.CharFilter(lookup_expr="exact")
    brand = django_filters.CharFilter(lookup_expr="icontains")
    min_price = django_filters.NumberFilter(field_name="price", lookup_expr="gte")
    max_price = django_filters.NumberFilter(field_name="price", lookup_expr="lte")

    color = django_filters.CharFilter(method="filter_color")
    size = django_filters.CharFilter(method="filter_size")
    search = django_filters.CharFilter(method="filter_search")

    class Meta:
        model = Product
        fields = []

    def filter_color(self, queryset, name, value):
        # value comes from a single CharFilter binding; read the RAW repeated
        # query params instead, since django-filter only hands this method
        # the last bound value for a given field name.
        values = self.data.getlist("color")
        if values:
            return queryset.filter(colors__has_any_keys=values)
        return queryset

    def filter_size(self, queryset, name, value):
        values = self.data.getlist("size")
        if values:
            return queryset.filter(sizes__has_any_keys=values)
        return queryset

    def filter_search(self, queryset, name, value):
        if value:
            return queryset.filter(Q(name__icontains=value) | Q(description__icontains=value))
        return queryset
```

`self.data` on a `FilterSet` is the `QueryDict` (DRF passes `request.query_params`, itself a
`QueryDict`) — `.getlist()` is the standard `QueryDict` API for repeated-key params
(`?color=Black&color=White`), the encoding recommended in §1.

---

## 3. "Within-facet OR, across-facet AND"

This is the standard faceted-search convention (used the same way by Elasticsearch/Solr facet
implementations and every major e-commerce filter UI): selecting two values in the *same* facet
(`color=Black` and `color=White`) widens the results (OR), because the user is saying "either is fine";
selecting values across *different* facets (`color=Black` and `size=M`) narrows the results (AND),
because the user wants both conditions satisfied simultaneously. This isn't a django-filter-specific
API — it's a query-construction pattern that `FilterSet` naturally supports because **django-filter
chains each declared filter's queryset method with `.filter()`/reassignment, one after another**: each
filter method (`filter_color`, `filter_size`, the scalar filters) receives the queryset already narrowed
by the previous filters and returns a further-narrowed queryset. Chaining separate `.filter()` calls is
Django's own AND: `qs.filter(A).filter(B)` is `WHERE A AND B`. Within one filter method, OR is expressed
explicitly (`has_any_keys=values`, or `Q(...) | Q(...)` for scalar multi-value fields, or `field__in=values`
for a plain `CharField`/`FK` facet like `brand` or `category`). So: **OR is built inside each filter's
method body; AND falls out for free from `FilterSet` applying each declared filter in sequence.** No
special orchestration is needed beyond writing each per-facet method to OR its own values together.

For a scalar multi-value facet (e.g. `brand`, if it moved from `icontains` to exact multi-select), the
equivalent OR construction is Django's own `__in` lookup — `Product.objects.filter(brand__in=values)` —
which is plain Django (`https://docs.djangoproject.com/en/6.0/ref/models/querysets/#in`), not something
that needs `Q()` chaining at all.

---

## 4. Facet counts

Primary source: Django aggregation docs
(`https://docs.djangoproject.com/en/6.0/topics/db/aggregation/#combining-multiple-aggregations`) plus
direct reasoning from the `Count(..., filter=Q(...))` API documented there.

### Conditional counts in one query per facet dimension

```python
from django.db.models import Count, Q

def size_facet_counts(queryset, all_sizes):
    return queryset.aggregate(
        **{
            size: Count("id", filter=Q(sizes__has_key=size))
            for size in all_sizes
        }
    )
    # -> {"S": 12, "M": 9, "L": 4, ...}  in ONE query
```

`Count(expr, filter=Q(...))` is Django's documented conditional-aggregation API:

> "If you need two annotations with two separate filters you can use the `filter` argument with any
> aggregate."

Building an `.aggregate()` call with one `Count(..., filter=Q(...))` kwarg per possible facet *value*
computes every count for one facet *dimension* (e.g. all sizes, or all colors) in a **single SQL
query** — Postgres evaluates each `FILTER (WHERE ...)` clause once per row, all in the same scan.

### The join-multiplication trap does NOT apply here, but know why

Django's docs give a well-known warning: *"Combining multiple aggregations with `annotate()` will yield
the wrong results because joins are used instead of subqueries"* — demonstrated with `Count("authors")`
+ `Count("store")` on the same `annotate()` call, where each `Count` pulls in a separate join and the
joins multiply against each other. That trap is specifically about **`annotate()`** (per-row output)
combined with **multiple to-many relations** on the *same* base row. The facet-count pattern above uses
`.aggregate()` (collapses to one row of scalars), and every `Count(..., filter=Q(...))` targets `id` on
the *same* `Product` table with a `WHERE`/`FILTER` predicate — no join fan-out is introduced, because
`colors`/`sizes` are JSONField columns on `Product` itself, not related tables. So the multiplication bug
Django warns about is a non-issue for this schema; it would only start to matter if a facet ever moved
onto a related/to-many table (e.g. if colors became a real `ManyToMany` to a `Color` model) — worth
flagging for later, not now.

### Query cost of a full facet-count payload

One `.aggregate()` call per **facet dimension** (`category`, `gender`, `brand`, `color`, `size`) — five
queries total for five facets, regardless of how many distinct values each dimension has, since all of a
dimension's per-value counts ride in the same aggregate call. That's independent of catalog size. At 50
rows this is trivial regardless of strategy; stated for honesty rather than because it's a bottleneck
here.

### Should counts reflect other active filters?

Two legitimate strategies, and the choice is a UX decision, not a technical one:

1. **Counts reflect all *other* active filters, excluding the facet's own filter** (the standard
   e-commerce convention — "if you also picked Black, how many products would there be in each size").
   Query strategy: build the queryset with every active filter **except** the one being counted, then
   run the conditional-`Count` aggregate against that queryset. This needs one filtered queryset per
   facet dimension (still one query per dimension via `.aggregate()`), e.g.:
   ```python
   base = Product.objects.filter(is_active=True)
   qs_for_size_counts = base.filter(category_filter).filter(color_filter)  # all EXCEPT size
   size_counts = qs_for_size_counts.aggregate(**{s: Count("id", filter=Q(sizes__has_key=s)) for s in all_sizes})
   ```
2. **Counts reflect the fully-filtered result set** (simpler — one queryset, reused for all facets'
   counts) — cheaper to implement (fewer distinct querysets to build) but tends toward zero counts as
   the user narrows down, which can look broken/discourage further refinement in a UI.

Strategy 1 is what users expect from mainstream storefront filtering; it costs no extra queries over
strategy 2 (still one `.aggregate()` per dimension) — the only added cost is constructing N different
"all filters except this one" querysets in Python, which is cheap. Recommend strategy 1 for that reason:
same query count, correct UX.

---

## 5. DRF `OrderingFilter`

Primary source: DRF filtering docs (`https://www.django-rest-framework.org/api-guide/filtering/#orderingfilter`).

- Add `rest_framework.filters.OrderingFilter` to `filter_backends` (either globally via
  `DEFAULT_FILTER_BACKENDS`, alongside the existing `DjangoFilterBackend`, or per-view).
- **Allow-list**: set `ordering_fields` on the view to a fixed list of safe fields. Docs: leaving it
  unset/`'__all__'` is explicitly discouraged except when "confident that the queryset doesn't include
  any sensitive data" — restricting it "helps prevent unexpected data leakage, such as allowing users to
  order against a password hash field or other sensitive data." For `ProductViewSet`, a safe allow-list
  is fields the serializer already exposes and that make sense to sort by: `price`, `rating`,
  `created_at`, `name`.
- **Default ordering**: set `ordering = [...]` on the view (`ordering_fields` is the allow-list,
  `ordering` is what's applied when the client sends no `?ordering=` param at all).
- **Query parameter format**: the default param name is `ordering` (overridable via
  `ORDERING_PARAM`/`ordering_param`); values are comma-separated field names, `-` prefix means
  descending: `?ordering=-price`, `?ordering=price,name`.

```python
# backend/apps/products/views.py (illustrative)
from rest_framework import filters as drf_filters

class ProductViewSet(viewsets.ReadOnlyModelViewSet):
    ...
    filter_backends = [DjangoFilterBackend, drf_filters.OrderingFilter]
    filterset_class = ProductFilter
    ordering_fields = ["price", "rating", "created_at", "name"]
    ordering = ["-created_at"]
```

Note `ProductPagination` (a `CursorPagination` with `ordering = "-created_at"`) already assumes
`-created_at` ordering for cursor stability — `CursorPagination` requires a **consistent, monotonic**
ordering field to produce valid cursors, so pairing `OrderingFilter`'s `ordering_fields` allow-list with
`CursorPagination` needs care: if a client is allowed to re-order by `price` (a non-unique, non-monotonic
field with ties), cursor pagination can misbehave across pages with duplicate values unless a secondary
unique tiebreaker is included. This is flagged as a real interaction to resolve during implementation,
not something resolved by this research ticket.

---

## Sources

- django-filter filter reference: https://django-filter.readthedocs.io/en/stable/ref/filters.html
- django-filter source, `filters.py` / `widgets.py`:
  https://github.com/carltongibson/django-filter/blob/main/django_filters/filters.py ,
  https://github.com/carltongibson/django-filter/blob/main/django_filters/widgets.py
- Django docs, querying JSONField: https://docs.djangoproject.com/en/6.0/topics/db/queries/#querying-jsonfield
- Django docs, querying ArrayField: https://docs.djangoproject.com/en/6.0/ref/contrib/postgres/fields/#querying-arrayfield
- Django source, JSONField lookups: https://github.com/django/django/blob/main/django/db/models/fields/json.py
- Django docs, aggregation (conditional `Count`, multiple-aggregation pitfall):
  https://docs.djangoproject.com/en/6.0/topics/db/aggregation/#combining-multiple-aggregations
- Django docs, `__in` lookup: https://docs.djangoproject.com/en/6.0/ref/models/querysets/#in
- DRF docs, filtering (`DjangoFilterBackend`, `OrderingFilter`):
  https://www.django-rest-framework.org/api-guide/filtering/
- PostgreSQL docs, JSON types, §8.14.3 "jsonb Containment and Existence":
  https://www.postgresql.org/docs/current/datatype-json.html
- PostgreSQL docs, JSON functions and operators (`@>`, `<@`, `?`, `?|`, `?&`):
  https://www.postgresql.org/docs/current/functions-json.html
- Repo (read for current state): `backend/apps/products/filters.py`, `backend/apps/products/models.py`,
  `backend/apps/products/views.py`, `backend/core/settings/base.py`, `backend/uv.lock`,
  `backend/pyproject.toml`
