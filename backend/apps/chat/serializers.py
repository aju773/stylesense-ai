from rest_framework import serializers

from apps.chat.services.product_markers import extract_product_ids
from apps.products.serializers import ProductCardSerializer

from .models import ChatMessage, Conversation


class ConversationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Conversation
        fields = ["id", "title", "is_active", "created_at", "updated_at"]
        read_only_fields = fields


class ChatMessageSerializer(serializers.ModelSerializer):
    products = serializers.SerializerMethodField()

    class Meta:
        model = ChatMessage
        fields = [
            "id",
            "role",
            "content",
            "ai_provider_used",
            "created_at",
            "products",
        ]
        read_only_fields = ["id", "role", "content", "ai_provider_used", "created_at"]

    def get_products(self, obj) -> list[dict]:
        """Cited products, ordered by first mention in the message body."""
        products = list(obj.products.all())
        if not products:
            return []
        position = {pk: i for i, pk in enumerate(extract_product_ids(obj.content))}
        products.sort(key=lambda product: position.get(product.pk, len(position)))
        return ProductCardSerializer(products, many=True).data


class SendMessageSerializer(serializers.Serializer):
    message = serializers.CharField(max_length=2000)
    conversation_id = serializers.IntegerField(required=False, default=None)
