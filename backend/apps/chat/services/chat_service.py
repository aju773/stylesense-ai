import logging

from apps.chat.models import ChatMessage, Conversation
from apps.chat.services.context_builder import ContextBuilder
from apps.chat.services.factory import get_ai_orchestrator

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are StyleSense AI, a warm and knowledgeable fashion stylist.
Your behavior:
- When the user asks about clothing, outfits, or style, recommend products from the catalog below when relevant. Mention the product name and price.
- When the catalog doesn't have a good match, give general fashion advice honestly — don't force catalog items that don't fit.
- Be conversational, warm, and concise. No walls of text.
- If the user asks something completely unrelated to fashion, politely redirect.
{product_context}"""
HISTORY_LIMIT = 20


class ChatService:
    """Orchestrates a chat turn: history + context + AI + persistence."""

    def __init__(self):
        self.context_builder = ContextBuilder()
        self.orchestrator = get_ai_orchestrator()

    async def send_message(self, user, conversation_id, message_text):
        """Process a user message and return the AI response.
        Args:
            user: The authenticated User instance.
            conversation_id: Existing conversation PK, or None to create new.
            message_text: The user's message string.
        Returns:
            tuple[Conversation, ChatMessage]: The conversation and AI response message.
        """
        # 1. Load or create conversation
        if conversation_id:
            conversation = await Conversation.objects.aget(
                pk=conversation_id,
                user=user,
            )
        else:
            conversation = await Conversation.objects.acreate(user=user)
        # 2. Save user message
        await ChatMessage.objects.acreate(
            conversation=conversation,
            role="user",
            content=message_text,
        )
        # 3. Load recent history
        history_qs = conversation.messages.all().order_by("-created_at")[:HISTORY_LIMIT]
        history = []
        async for msg in history_qs:
            history.append({"role": msg.role, "content": msg.content})
        history.reverse()  # Back to chronological order
        # 4. Build product context via vector search
        product_context = await self.context_builder.build_product_context(
            message_text,
        )
        # 5. Construct messages for AI
        system_prompt = SYSTEM_PROMPT.format(product_context=product_context)
        messages = [{"role": "system", "content": system_prompt}] + history
        # 6. Call AI
        ai_response = await self.orchestrator.generate_completion(messages)
        # 7. Save AI response
        ai_message = await ChatMessage.objects.acreate(
            conversation=conversation,
            role="assistant",
            content=ai_response,
        )
        # 8. Auto-generate title from first message
        if not conversation.title:
            conversation.title = message_text[:50]
            await conversation.asave(update_fields=["title"])
        return conversation, ai_message

    async def send_message_stream(self, user, conversation_id, message_text):
        """Process a user message and stream the AI response token-by-token.

        Yields:
            str: Individual tokens as they arrive from the AI provider.

        After the stream completes, the full AI response is saved as a ChatMessage.
        """
        if conversation_id:
            conversation = await Conversation.objects.aget(
                pk=conversation_id,
                user=user,
            )
        else:
            conversation = await Conversation.objects.acreate(user=user)
        # 2. Save user message
        await ChatMessage.objects.acreate(
            conversation=conversation,
            role="user",
            content=message_text,
        )
        # >>> NEW: Yield stream_start with conversation_id
        yield {"event": "stream_start", "conversation_id": str(conversation.pk)}
        # 3. Load recent history
        history_qs = conversation.messages.all().order_by("-created_at")[:HISTORY_LIMIT]
        history = []
        async for msg in history_qs:
            history.append({"role": msg.role, "content": msg.content})
        history.reverse()
        # 4. Build product context via vector search
        product_context = await self.context_builder.build_product_context(
            message_text,
        )
        # 5. Construct messages for AI
        system_prompt = SYSTEM_PROMPT.format(product_context=product_context)
        messages = [{"role": "system", "content": system_prompt}] + history
        # 6. Stream AI response, accumulating tokens
        full_response = []
        async for token in self.orchestrator.generate_completion_stream(messages):
            full_response.append(token)
            yield {"event": "token", "content": token}
        # 7. Save complete AI response
        ai_content = "".join(full_response)
        ai_message = await ChatMessage.objects.acreate(
            conversation=conversation,
            role="assistant",
            content=ai_content,
        )
        # 8. Auto-generate title from first message
        if not conversation.title:
            conversation.title = message_text[:50]
            await conversation.asave(update_fields=["title"])
        # >>> NEW: Yield stream_end with message_id
        yield {"event": "stream_end", "message_id": str(ai_message.pk), "conversation_id": str(conversation.pk)}
