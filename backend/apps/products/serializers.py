from rest_framework import serializers

from .models import Category, Product, ProductImage


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ("id", "name", "slug")


class PrimaryImageMixin:
    """Resolves the `is_primary` image, falling back to the first row.

    Reads the prefetched `images` list rather than querying — every consumer's
    queryset already does `.prefetch_related("images")`.
    """

    def get_image_url(self, obj) -> str | None:
        images = list(obj.images.all())
        if not images:
            return None
        primary = next((img for img in images if img.is_primary), images[0])
        return primary.image_url


class ProductSerializer(PrimaryImageMixin, serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = (
            "id",
            "name",
            "slug",
            "description",
            "price",
            "discount_price",
            "brand",
            "sizes",
            "colors",
            "gender",
            "stock",
            "rating",
            "category",
            "image_url",
        )


class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ("id", "image_url", "is_primary", "display_order")


class ProductDetailSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    images = ProductImageSerializer(many=True, read_only=True)

    class Meta:
        model = Product
        fields = (
            "id",
            "name",
            "slug",
            "description",
            "price",
            "discount_price",
            "brand",
            "sizes",
            "colors",
            "gender",
            "stock",
            "rating",
            "category",
            "images",
        )


class ProductCardSerializer(PrimaryImageMixin, serializers.ModelSerializer):
    """Compact product payload for inline AI chat cards.

    `stock`/`sizes`/`colors` were added for 11.11: the chat card needs stock to
    render an out-of-stock state independent of 11.10's retrieval-time
    `stock__gt=0` filter (a pick can go out of stock between the reply and the
    click, and history replays old picks), and sizes/colors to drive its
    inline Add to Bag variant picker.
    """

    image_url = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = (
            "id",
            "name",
            "slug",
            "brand",
            "price",
            "discount_price",
            "image_url",
            "stock",
            "sizes",
            "colors",
        )
