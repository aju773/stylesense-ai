from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import CategoryListView, ProductViewSet

app_name = "products"

router = DefaultRouter()
router.register("", ProductViewSet, basename="product")

urlpatterns = [
    path("categories/", CategoryListView.as_view(), name="category-list"),
    path("", include(router.urls)),
]
