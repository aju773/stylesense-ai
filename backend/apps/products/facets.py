from django.db.models import Count, Q

from .filters import ProductFilter
from .models import Category, Product

FACET_DIMENSIONS = ("category", "gender", "brand", "color", "size")


def _json_array_values(queryset, field):
    """Distinct string values across a JSONField-of-arrays column.

    `colors`/`sizes` are plain JSONField, not ArrayField — there is no
    DISTINCT-unnest at the DB layer, and the catalog is 50 rows, so flattening
    in Python is the simplest correct option.
    """
    values = set()
    for arr in queryset.values_list(field, flat=True):
        values.update(arr or [])
    return sorted(values)


def _counts(queryset, values, predicate):
    """One `.aggregate()` call computes every value's count for a dimension."""
    if not values:
        return {}
    aggregates = {
        f"v{i}": Count("id", filter=predicate(v)) for i, v in enumerate(values)
    }
    result = queryset.aggregate(**aggregates)
    return {v: result[f"v{i}"] for i, v in enumerate(values)}


def _excluding(request, base_queryset, dimension):
    """`base_queryset` narrowed by every active filter except `dimension`.

    Counts reflect every *other* active facet — selecting Women updates the
    Category counts while Gender's own counts hold, so another gender can
    still be added. Reuses `ProductFilter` itself rather than duplicating its
    filter logic: dropping one query param and re-running the whole FilterSet
    is what "all filters except this one" means.
    """
    data = request.query_params.copy()
    data.pop(dimension, None)
    return ProductFilter(data, queryset=base_queryset, request=request).qs


def build_facets(request, base_queryset):
    """`{dimension: [{value, label, count}, ...]}` for the list response.

    Zero-count options are included, not dropped — a facet's *set* of options
    always comes from the full catalog (`base_queryset`), never from the
    filtered result set, so a shopper sees "Levi's 0" rather than Levi's
    silently disappearing from the list.
    """
    categories = list(Category.objects.values("slug", "name"))
    genders = [choice[0] for choice in Product.GENDER_CHOICES]
    brands = sorted(base_queryset.values_list("brand", flat=True).distinct())
    colors = _json_array_values(base_queryset, "colors")
    sizes = _json_array_values(base_queryset, "sizes")

    category_counts = _counts(
        _excluding(request, base_queryset, "category"),
        [c["slug"] for c in categories],
        lambda v: Q(category__slug=v),
    )
    gender_counts = _counts(
        _excluding(request, base_queryset, "gender"), genders, lambda v: Q(gender=v)
    )
    brand_counts = _counts(
        _excluding(request, base_queryset, "brand"), brands, lambda v: Q(brand=v)
    )
    color_counts = _counts(
        _excluding(request, base_queryset, "color"),
        colors,
        lambda v: Q(colors__has_key=v),
    )
    size_counts = _counts(
        _excluding(request, base_queryset, "size"), sizes, lambda v: Q(sizes__has_key=v)
    )

    return {
        "category": [
            {
                "value": c["slug"],
                "label": c["name"],
                "count": category_counts[c["slug"]],
            }
            for c in categories
        ],
        "gender": [
            {"value": g, "label": g, "count": gender_counts[g]} for g in genders
        ],
        "brand": [{"value": b, "label": b, "count": brand_counts[b]} for b in brands],
        "color": [{"value": c, "label": c, "count": color_counts[c]} for c in colors],
        "size": [{"value": s, "label": s, "count": size_counts[s]} for s in sizes],
    }
