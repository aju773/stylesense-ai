from django.contrib import admin

from .models import Order, OrderItem


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    # Lines are a snapshot of a completed transaction. Editing them in the
    # admin would silently desync them from the order's frozen totals.
    readonly_fields = (
        "product",
        "product_name",
        "product_brand",
        "product_slug",
        "image_url",
        "size",
        "color",
        "quantity",
        "list_price",
        "unit_price",
    )
    can_delete = False

    def has_add_permission(self, request, obj):
        return False


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ("order_number", "user", "status", "total", "placed_at")
    list_filter = ("status", "placed_at")
    search_fields = ("order_number", "user__email")
    readonly_fields = (
        "order_number",
        "user",
        "subtotal",
        "discount",
        "shipping",
        "total",
        "payment_reference",
        "placed_at",
        "updated_at",
    )
    inlines = [OrderItemInline]


@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "order",
        "product_name",
        "size",
        "color",
        "quantity",
        "unit_price",
    )
    search_fields = ("product_name", "order__order_number", "order__user__email")
