from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import generics, permissions, viewsets
from rest_framework.filters import OrderingFilter
from rest_framework.pagination import PageNumberPagination

from .facets import build_facets
from .filters import ProductFilter
from .models import Category, Product
from .serializers import CategorySerializer, ProductDetailSerializer, ProductSerializer

SORT_PRESETS = {
    "recommended": ("-rating", "-created_at", "id"),
    "price": ("price", "id"),
    "-price": ("-price", "id"),
    "-rating": ("-rating", "id"),
    "-created_at": ("-created_at", "id"),
}
DEFAULT_SORT = "recommended"


class ProductSortFilter(OrderingFilter):
    def get_ordering(self, request, queryset, view):
        preset = request.query_params.get("ordering", DEFAULT_SORT)
        return list(SORT_PRESETS.get(preset, SORT_PRESETS[DEFAULT_SORT]))


class ProductPagination(PageNumberPagination):
    page_size = 12


class ProductViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = (
        Product.objects.filter(is_active=True)
        .select_related("category")
        .prefetch_related("images")
    )
    pagination_class = ProductPagination
    permission_classes = [permissions.AllowAny]
    lookup_field = "slug"
    filterset_class = ProductFilter
    filter_backends = [DjangoFilterBackend, ProductSortFilter]

    def get_serializer_class(self):
        if self.action == "retrieve":
            return ProductDetailSerializer
        return ProductSerializer

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        serializer = self.get_serializer(page, many=True)
        response = self.get_paginated_response(serializer.data)
        response.data["facets"] = build_facets(request, self.get_queryset())
        return response


class CategoryListView(generics.ListAPIView):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = None
