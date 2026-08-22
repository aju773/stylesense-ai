from rest_framework import serializers

from .models import Category, Product, ProductImage


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ("id", "name", "slug")


class ProductSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)

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


class ProductCardSerializer(serializers.ModelSerializer):
    """Compact product payload for inline AI chat cards."""

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
        )

    def get_image_url(self, obj) -> str | None:
        # Uses the prefetched `images` list — no per-card query.
        images = list(obj.images.all())
        if not images:
            return None
        primary = next((img for img in images if img.is_primary), images[0])
        return primary.image_url
