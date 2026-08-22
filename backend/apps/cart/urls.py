from django.urls import path

from . import views

app_name = "cart"

urlpatterns = [
    path("", views.CartView.as_view(), name="cart-detail"),
    path("items/", views.CartItemListView.as_view(), name="cart-item-list"),
    path(
        "items/<int:item_id>/",
        views.CartItemDetailView.as_view(),
        name="cart-item-detail",
    ),
]
