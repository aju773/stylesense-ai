from rest_framework import serializers

from .models import Order, OrderItem


class OrderItemSerializer(serializers.ModelSerializer):
    """One purchased line, as it was priced when it was bought.

    Everything here comes from the order's own snapshot columns, never from the
    live catalog — a markdown applied tomorrow must not rewrite what this
    customer paid today. `product_id` is the one live link, and it goes null if
    the product is ever deleted, so the UI must treat it as optional.
    """

    line_total = serializers.DecimalField(
        max_digits=12, decimal_places=2, read_only=True
    )

    class Meta:
        model = OrderItem
        fields = [
            "id",
            "product_id",
            "product_name",
            "product_brand",
            "product_slug",
            "image_url",
            "size",
            "color",
            "quantity",
            "list_price",
            "unit_price",
            "line_total",
        ]
        read_only_fields = fields


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    status_label = serializers.CharField(source="get_status_display", read_only=True)
    item_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Order
        fields = [
            "id",
            "order_number",
            "status",
            "status_label",
            "subtotal",
            "discount",
            "shipping",
            "total",
            "item_count",
            "items",
            "placed_at",
        ]
        read_only_fields = fields


class PlaceOrderSerializer(serializers.Serializer):
    """The entire checkout payload.

    No amounts, no line ids, no cart contents — the server reads the caller's
    own cart and re-totals it from live prices. A token is the only thing the
    client gets to supply, and even that only picks which way the mock gateway
    answers.
    """

    payment_token = serializers.CharField(
        max_length=64, allow_blank=True, required=False, default=""
    )
