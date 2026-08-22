from rest_framework import serializers

from apps.products.serializers import ProductCardSerializer

from .models import CartItem
from .services.cart_service import MAX_QUANTITY_PER_LINE, line_unit_price


class CartItemSerializer(serializers.ModelSerializer):
    """One bag line, with the product card the UI renders it from."""

    product = ProductCardSerializer(read_only=True)
    unit_price = serializers.SerializerMethodField()
    line_total = serializers.SerializerMethodField()

    class Meta:
        model = CartItem
        fields = [
            "id",
            "product",
            "size",
            "color",
            "quantity",
            "unit_price",
            "line_total",
            "added_at",
        ]
        read_only_fields = fields

    def get_unit_price(self, obj) -> str:
        """Price actually charged per unit — the markdown if there is one."""
        return str(line_unit_price(obj))

    def get_line_total(self, obj) -> str:
        return str(line_unit_price(obj) * obj.quantity)


class CartTotalsSerializer(serializers.Serializer):
    subtotal = serializers.DecimalField(max_digits=12, decimal_places=2)
    discount = serializers.DecimalField(max_digits=12, decimal_places=2)
    shipping = serializers.DecimalField(max_digits=12, decimal_places=2)
    total = serializers.DecimalField(max_digits=12, decimal_places=2)
    item_count = serializers.IntegerField()
    line_count = serializers.IntegerField()


class CartSerializer(serializers.Serializer):
    """The whole bag: lines plus server-computed money."""

    items = CartItemSerializer(many=True, read_only=True)
    totals = CartTotalsSerializer(read_only=True)


class AddCartItemSerializer(serializers.Serializer):
    product_id = serializers.IntegerField()
    size = serializers.CharField(max_length=20, allow_blank=True, default="")
    color = serializers.CharField(max_length=50, allow_blank=True, default="")
    quantity = serializers.IntegerField(
        min_value=1, max_value=MAX_QUANTITY_PER_LINE, default=1
    )


class UpdateCartItemSerializer(serializers.Serializer):
    quantity = serializers.IntegerField(min_value=1, max_value=MAX_QUANTITY_PER_LINE)
