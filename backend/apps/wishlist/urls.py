from django.urls import path

from . import views

app_name = "wishlist"

urlpatterns = [
    path("", views.WishlistView.as_view(), name="wishlist-list"),
    path("toggle/", views.WishlistToggleView.as_view(), name="wishlist-toggle"),
    path(
        "items/<int:item_id>/",
        views.WishlistItemDetailView.as_view(),
        name="wishlist-item-detail",
    ),
]
