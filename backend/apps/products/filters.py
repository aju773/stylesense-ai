import django_filters
from django.db.models import Q

from .models import Product


class ProductFilter(django_filters.FilterSet):
    # Every multi-value facet below is bound to a single-value CharFilter but
    # reads the raw repeated query params instead (`self.data.getlist(name)`),
    # since django-filter only ever hands a method the last bound value for a
    # given field name. `?color=Black&color=White` is within-facet OR — the
    # standard e-commerce facet semantic — and AND falls out for free across
    # facets, since FilterSet chains each declared filter's `.filter()` call.
    category = django_filters.CharFilter(method="filter_category")
    gender = django_filters.CharFilter(method="filter_gender")
    brand = django_filters.CharFilter(method="filter_brand")
    min_price = django_filters.NumberFilter(field_name="price", lookup_expr="gte")
    max_price = django_filters.NumberFilter(field_name="price", lookup_expr="lte")
    # colors/sizes are plain JSONField, not ArrayField — __overlap doesn't
    # exist on them, and __contains compiles to jsonb `@>`, which is an AND
    # test ("has ALL of these"), not OR. has_any_keys compiles to `?|`, which
    # is the correct "has ANY of these array elements" lookup.
    color = django_filters.CharFilter(method="filter_color")
    size = django_filters.CharFilter(method="filter_size")
    # Free-text search across name + description — stays single-valued.
    search = django_filters.CharFilter(method="filter_search")

    class Meta:
        model = Product
        fields = []  # all filters declared explicitly above

    def filter_category(self, queryset, name, value):
        values = self.data.getlist("category")
        if values:
            return queryset.filter(category__slug__in=values)
        return queryset

    def filter_gender(self, queryset, name, value):
        values = self.data.getlist("gender")
        if values:
            return queryset.filter(gender__in=values)
        return queryset

    def filter_brand(self, queryset, name, value):
        values = self.data.getlist("brand")
        if values:
            return queryset.filter(brand__in=values)
        return queryset

    def filter_color(self, queryset, name, value):
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
            return queryset.filter(
                Q(name__icontains=value) | Q(description__icontains=value)
            )
        return queryset
