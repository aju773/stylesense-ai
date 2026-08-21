import django_filters
from django.db.models import Q

from .models import Product


class ProductFilter(django_filters.FilterSet):
    # Category by slug — cleaner URLs than using category ID
    category = django_filters.CharFilter(
        field_name="category__slug", lookup_expr="exact"
    )
    gender = django_filters.CharFilter(lookup_expr="exact")
    brand = django_filters.CharFilter(lookup_expr="icontains")
    min_price = django_filters.NumberFilter(field_name="price", lookup_expr="gte")
    max_price = django_filters.NumberFilter(field_name="price", lookup_expr="lte")
    # JSON fields need custom methods — __contains expects a list, not a bare string
    color = django_filters.CharFilter(method="filter_color")
    size = django_filters.CharFilter(method="filter_size")
    # Free-text search across name + description
    search = django_filters.CharFilter(method="filter_search")

    class Meta:
        model = Product
        fields = []  # all filters declared explicitly above

    def filter_color(self, queryset, name, value):
        if value:
            return queryset.filter(colors__contains=[value])
        return queryset

    def filter_size(self, queryset, name, value):
        if value:
            return queryset.filter(sizes__contains=[value])
        return queryset

    def filter_search(self, queryset, name, value):
        if value:
            return queryset.filter(
                Q(name__icontains=value) | Q(description__icontains=value)
            )
        return queryset
