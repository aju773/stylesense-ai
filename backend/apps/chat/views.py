from adrf.views import APIView
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import ChatMessage, Conversation
from .serializers import (
    ChatMessageSerializer,
    ConversationSerializer,
    RenameConversationSerializer,
    SendMessageSerializer,
)
from .services.chat_service import ChatService


class ConversationListView(APIView):
    permission_classes = [IsAuthenticated]

    async def get(self, request):
        """List user's conversations (newest first)."""
        conversations = []
        async for convo in request.user.conversations.order_by("-created_at"):
            conversations.append(convo)
        serializer = ConversationSerializer(conversations, many=True)
        return Response(serializer.data)


class ConversationDetailView(APIView):
    permission_classes = [IsAuthenticated]

    async def patch(self, request, conversation_id):
        """Rename a conversation, or clear its title back to auto-generated.

        Scoped to the caller's own conversations the same way
        `get_owned_item` scopes cart/wishlist rows: someone else's id is
        indistinguishable from a nonexistent one.
        """
        try:
            conversation = await Conversation.objects.aget(
                pk=conversation_id,
                user=request.user,
            )
        except Conversation.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)

        serializer = RenameConversationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        conversation.title = serializer.validated_data["title"] or None
        await conversation.asave(update_fields=["title"])

        return Response(ConversationSerializer(conversation).data)


class ConversationMessagesView(APIView):
    permission_classes = [IsAuthenticated]
    throttle_scope = "chat"

    async def get(self, request, conversation_id):
        """List messages in a conversation (chronological)."""
        try:
            conversation = await Conversation.objects.aget(
                pk=conversation_id,
                user=request.user,
            )
        except Conversation.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        messages = []
        async for msg in conversation.messages.prefetch_related("products__images"):
            messages.append(msg)
        serializer = ChatMessageSerializer(messages, many=True)
        return Response(serializer.data)

    async def post(self, request, conversation_id=None):
        """Send a message — triggers AI response."""
        input_serializer = SendMessageSerializer(data=request.data)
        input_serializer.is_valid(raise_exception=True)
        message_text = input_serializer.validated_data["message"]
        convo_id = conversation_id or input_serializer.validated_data.get(
            "conversation_id"
        )
        service = ChatService()
        try:
            conversation, ai_message = await service.send_message(
                user=request.user,
                conversation_id=convo_id,
                message_text=message_text,
            )
        except Conversation.DoesNotExist:
            return Response(
                {"error": "Conversation not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        ai_message = await ChatMessage.objects.prefetch_related(
            "products__images",
        ).aget(pk=ai_message.pk)
        return Response(
            {
                "conversation": ConversationSerializer(conversation).data,
                "message": ChatMessageSerializer(ai_message).data,
            },
            status=status.HTTP_201_CREATED,
        )
