from django.contrib import admin

from .models import WishlistItem


@admin.register(WishlistItem)
class WishlistItemAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "product", "source", "added_at")
    list_filter = ("source",)
    search_fields = ("user__email", "product__name")
    autocomplete_fields = ("product",)
