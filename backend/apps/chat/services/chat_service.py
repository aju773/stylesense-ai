import logging

from apps.chat.models import ChatMessage, Conversation
from apps.chat.services.context_builder import ContextBuilder
from apps.chat.services.factory import get_ai_orchestrator
from apps.chat.services.product_markers import extract_product_ids, extract_reasons
from apps.products.models import Product
from apps.products.serializers import ProductCardSerializer

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are StyleSense AI, a warm and knowledgeable fashion stylist.
Your behavior:
- When the user asks about clothing, outfits, or style, recommend products from the catalog below when relevant. Mention the product name and price.
- When the catalog doesn't have a good match, give general fashion advice honestly — don't force catalog items that don't fit.
- Be conversational, warm, and concise. No walls of text.
- If the user asks something completely unrelated to fashion, politely redirect.
- Size and budget in the shopper's profile are not hard requirements — a product outside either is still worth mentioning with a caveat (e.g. "runs small, size up" or "over budget but worth it"). Never hide a good product only because of size or budget.
- If a recommendation would clearly benefit from knowing the shopper's size, budget, gender or aesthetic, you may invite them to set their style preferences in their profile — but do this at most once per conversation.
{user_profile}
Product citation rules (strict):
- Each catalog entry below starts with its id, like [id:12]. When you mention a catalog product, write its name followed immediately by the marker [[product:12]] using that exact id.
- Only use ids that appear in the catalog below. Never invent an id.
- Never recommend a specific catalog product without its marker.
- Cite each product at most once per reply.
- After your reply, on new lines, add one rationale line per product you cited: [[why:12]] followed by a single sentence (about 120 characters or fewer) saying why that pick fits. One line per cited id, in any order.
- The markers and rationale lines are invisible formatting. Never mention them, explain them, or show ids to the user.
{product_context}"""
HISTORY_LIMIT = 20


def _build_user_profile_block(user) -> str:
    """Render the `{user_profile}` block, or "" when preferences are empty.

    Omitted entirely (not a "no preferences on file" placeholder) because an
    empty profile is the normal case, and an explicit absence line invites the
    model to reference it far more often than intended.
    """
    prefs = getattr(user, "style_preferences", None) or {}
    vibes = prefs.get("vibes") or []
    size = prefs.get("size")
    budget = prefs.get("budget") or {}
    gender = prefs.get("gender")

    lines = []
    if vibes:
        lines.append(f"- Preferred aesthetic: {', '.join(vibes)}")
    if size:
        lines.append(f"- Usual size: {size}")
    budget_min, budget_max = budget.get("min"), budget.get("max")
    if budget_min is not None or budget_max is not None:
        if budget_min is not None and budget_max is not None:
            lines.append(f"- Budget: ₹{budget_min}-₹{budget_max}")
        elif budget_max is not None:
            lines.append(f"- Budget: up to ₹{budget_max}")
        else:
            lines.append(f"- Budget: from ₹{budget_min}")
    if gender:
        lines.append(f"- Shops for: {gender}")

    if not lines:
        return ""
    return "\nShopper's style profile (use as guidance, not a hard filter):\n" + "\n".join(lines) + "\n"


class ChatService:
    """Orchestrates a chat turn: history + context + AI + persistence."""

    def __init__(self):
        self.context_builder = ContextBuilder()
        self.orchestrator = get_ai_orchestrator()

    async def _attach_cited_products(self, ai_message, content) -> list[dict]:
        """Link the products the AI cited to the saved message.

        Ids come from a prompt-level contract the model can break, so they are
        validated against the database here — unknown ids are dropped silently.
        Returns the serialized cards, ordered by first mention in the reply.
        """
        product_ids = extract_product_ids(content)
        if not product_ids:
            return []
        products = []
        async for product in Product.objects.filter(
            pk__in=product_ids,
            is_active=True,
        ).prefetch_related("images"):
            products.append(product)
        if not products:
            return []
        position = {pk: index for index, pk in enumerate(product_ids)}
        products.sort(key=lambda product: position[product.pk])
        await ai_message.products.aset(products)
        reasons = extract_reasons(content)
        cards = ProductCardSerializer(products, many=True).data
        for card in cards:
            card["reason"] = reasons.get(card["id"])
        return cards

    async def send_message(self, user, conversation_id, message_text):
        """Process a user message and return the AI response.
        Args:
            user: The authenticated User instance.
            conversation_id: Existing conversation PK, or None to create new.
            message_text: The user's message string.
        Returns:
            tuple[Conversation, ChatMessage]: The conversation and AI response message.
        """
        if conversation_id:
            conversation = await Conversation.objects.aget(
                pk=conversation_id,
                user=user,
            )
        else:
            conversation = await Conversation.objects.acreate(user=user)
        await ChatMessage.objects.acreate(
            conversation=conversation,
            role="user",
            content=message_text,
        )
        history_qs = conversation.messages.all().order_by("-created_at")[:HISTORY_LIMIT]
        history = []
        async for msg in history_qs:
            history.append({"role": msg.role, "content": msg.content})
        history.reverse()
        product_context = await self.context_builder.build_product_context(
            message_text,
            user,
        )
        system_prompt = SYSTEM_PROMPT.format(
            user_profile=_build_user_profile_block(user),
            product_context=product_context,
        )
        messages = [{"role": "system", "content": system_prompt}] + history
        ai_response = await self.orchestrator.generate_completion(messages)
        ai_message = await ChatMessage.objects.acreate(
            conversation=conversation,
            role="assistant",
            content=ai_response,
        )
        await self._attach_cited_products(ai_message, ai_response)
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
        await ChatMessage.objects.acreate(
            conversation=conversation,
            role="user",
            content=message_text,
        )
        yield {"event": "stream_start", "conversation_id": str(conversation.pk)}
        history_qs = conversation.messages.all().order_by("-created_at")[:HISTORY_LIMIT]
        history = []
        async for msg in history_qs:
            history.append({"role": msg.role, "content": msg.content})
        history.reverse()
        product_context = await self.context_builder.build_product_context(
            message_text,
            user,
        )
        system_prompt = SYSTEM_PROMPT.format(
            user_profile=_build_user_profile_block(user),
            product_context=product_context,
        )
        messages = [{"role": "system", "content": system_prompt}] + history
        full_response = []
        async for token in self.orchestrator.generate_completion_stream(messages):
            full_response.append(token)
            yield {"event": "token", "content": token}
        ai_content = "".join(full_response)
        ai_message = await ChatMessage.objects.acreate(
            conversation=conversation,
            role="assistant",
            content=ai_content,
        )
        products = await self._attach_cited_products(ai_message, ai_content)
        if products:
            yield {"event": "products", "products": products}
        if not conversation.title:
            conversation.title = message_text[:50]
            await conversation.asave(update_fields=["title"])
        yield {"event": "stream_end", "message_id": str(ai_message.pk), "conversation_id": str(conversation.pk)}
