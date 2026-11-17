from pgvector.django import CosineDistance

from apps.products.models import Product
from apps.products.services.embedding_service import GeminiEmbeddingService


class ContextBuilder:
    """Builds product context for AI system prompt using vector search."""

    def __init__(self, top_k: int = 5):
        self.top_k = top_k
        self.embedding_service = GeminiEmbeddingService()

    async def build_product_context(self, user_message: str, user=None) -> str:
        """Embed user message + style profile, find similar products, return context.

        `user` is optional so the retrieval path degrades gracefully without a
        profile, but every real caller passes the authenticated user. Vibes and
        gender are folded into the text that gets embedded — the only way a
        vibe can influence retrieval, since no catalog field describes one.
        `gender` additionally hard-filters the queryset: a menswear item
        surfacing for a womenswear shopper is wrong, not a nuance, and halving
        a 50-product pool still leaves plenty for `top_k`. Size and budget
        deliberately do NOT filter — a mismatch there is a caveat the stylist
        should surface, not a reason to hide the product. `stock` does filter:
        zero stock is unavailability, not a caveat the stylist has advice to
        give, and with `top_k = 5` every unbuyable pick is a fifth of the reply.
        """
        has_embeddings = await Product.objects.filter(
            embedding__isnull=False,
            stock__gt=0,
        ).aexists()
        if not has_embeddings:
            return "No product catalog available."

        prefs = (getattr(user, "style_preferences", None) or {}) if user else {}
        embed_text = self._build_embed_text(user_message, prefs)

        query_vector = await self.embedding_service.generate_embedding_async(
            embed_text,
        )
        queryset = (
            Product.objects.filter(embedding__isnull=False, stock__gt=0)
            .select_related("category")
            .annotate(distance=CosineDistance("embedding", query_vector))
        )
        gender = prefs.get("gender")
        if gender:
            queryset = queryset.filter(gender=gender)
        products = queryset.order_by("distance")[: self.top_k]
        return await self._format_products(products)

    def _build_embed_text(self, user_message: str, prefs: dict) -> str:
        """Fold vibes/gender/category intent into the text that gets embedded.

        This is the only path by which a vibe (or gender, redundantly with the
        hard filter) can steer *retrieval* — nothing in the catalog schema
        describes a vibe, so it can only nudge which products look similar.
        """
        vibes = prefs.get("vibes") or []
        gender = prefs.get("gender")
        extras = []
        if vibes:
            extras.append(f"aesthetic: {', '.join(vibes)}")
        if gender:
            extras.append(f"for {gender}")
        if not extras:
            return user_message
        return f"{user_message} ({'; '.join(extras)})"

    async def _format_products(self, products) -> str:
        """Format products as natural language context for the AI."""
        lines = ["Here are relevant products from our catalog:\n"]
        async for product in products:
            lines.append(
                f"- [id:{product.id}] {product.name} | Brand: {product.brand} | ₹{product.price} | "
                f"Category: {product.category.name} | "
                f"Colors: {', '.join(product.colors)} | "
                f"Sizes: {', '.join(product.sizes)} | "
                f"{product.description}"
            )
        return "\n".join(lines)
