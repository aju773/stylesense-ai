from rest_framework import serializers

from apps.products.serializers import ProductCardSerializer

from .models import WishlistItem


class WishlistItemSerializer(serializers.ModelSerializer):
    """One saved product, with the card the UI renders it from.

    Carries no price of its own: a wishlist points at the live catalog, so the
    price shown is whatever the product costs today, markdown included.
    """

    product = ProductCardSerializer(read_only=True)
    in_stock = serializers.SerializerMethodField()

    class Meta:
        model = WishlistItem
        fields = ["id", "product", "source", "in_stock", "added_at"]
        read_only_fields = fields

    def get_in_stock(self, obj) -> bool:
        """Stock isn't on the product card, and the page dims sold-out saves."""
        return obj.product.stock > 0


class ToggleWishlistSerializer(serializers.Serializer):
    product_id = serializers.IntegerField()
    source = serializers.ChoiceField(
        choices=WishlistItem.Source.choices,
        default=WishlistItem.Source.MANUAL,
    )
