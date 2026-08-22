from pgvector.django import CosineDistance

from apps.products.models import Product
from apps.products.services.embedding_service import GeminiEmbeddingService


class ContextBuilder:
    """Builds product context for AI system prompt using vector search."""

    def __init__(self, top_k: int = 5):
        self.top_k = top_k
        self.embedding_service = GeminiEmbeddingService()

    async def build_product_context(self, user_message: str) -> str:
        """Embed user message, find similar products, return formatted context."""
        # Check if any products have embeddings
        has_embeddings = await Product.objects.filter(
            embedding__isnull=False,
        ).aexists()
        if not has_embeddings:
            return "No product catalog available."
        # Embed the user's message
        query_vector = await self.embedding_service.generate_embedding_async(
            user_message,
        )
        # Cosine similarity search
        products = (
            Product.objects.filter(embedding__isnull=False)
            .select_related("category")
            .annotate(distance=CosineDistance("embedding", query_vector))
            .order_by("distance")[: self.top_k]
        )
        return await self._format_products(products)

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
