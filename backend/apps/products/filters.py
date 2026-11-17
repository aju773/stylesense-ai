import django_filters
from django.db.models import Q

from .models import Product


class ProductFilter(django_filters.FilterSet):
    category = django_filters.CharFilter(method="filter_category")
    gender = django_filters.CharFilter(method="filter_gender")
    brand = django_filters.CharFilter(method="filter_brand")
    min_price = django_filters.NumberFilter(field_name="price", lookup_expr="gte")
    max_price = django_filters.NumberFilter(field_name="price", lookup_expr="lte")
    color = django_filters.CharFilter(method="filter_color")
    size = django_filters.CharFilter(method="filter_size")
    search = django_filters.CharFilter(method="filter_search")

    class Meta:
        model = Product
        fields = []

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
