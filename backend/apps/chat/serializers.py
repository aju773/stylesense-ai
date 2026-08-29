from rest_framework import serializers

from apps.chat.services.product_markers import extract_product_ids, extract_reasons
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
        """Cited products with their reasons, both reparsed from stored content.

        No schema change needed for reasons: `ChatMessage.content` already
        keeps markers intact for exactly this purpose, so a `[[why:12]]` line
        is just as re-derivable as citation order was.
        """
        products = list(obj.products.all())
        if not products:
            return []
        position = {pk: i for i, pk in enumerate(extract_product_ids(obj.content))}
        products.sort(key=lambda product: position.get(product.pk, len(position)))
        reasons = extract_reasons(obj.content)
        cards = ProductCardSerializer(products, many=True).data
        for card in cards:
            card["reason"] = reasons.get(card["id"])
        return cards


class SendMessageSerializer(serializers.Serializer):
    message = serializers.CharField(max_length=2000)
    conversation_id = serializers.IntegerField(required=False, default=None)


class RenameConversationSerializer(serializers.Serializer):
    # Capped at 50 to match the auto-generated title (first 50 chars of the
    # first message) rather than the model's own 255-char ceiling — manual and
    # auto titles should behave the same in the sidebar's truncated row.
    title = serializers.CharField(max_length=50, allow_blank=True, trim_whitespace=True)
