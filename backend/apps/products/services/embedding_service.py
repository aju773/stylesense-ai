import logging

from django.conf import settings
from google import genai
from google.genai import types

logger = logging.getLogger(__name__)


class GeminiEmbeddingService:
    def __init__(
        self,
        model_name: str = "gemini-embedding-001",
        dimensions: int = 768,
    ):
        self.model_name = model_name
        self.dimensions = dimensions
        self.client = genai.Client(api_key=settings.GEMINI_API_KEY)

    def generate_embedding(self, text: str) -> list[float]:
        """Generate a single text embedding vector (768 dimensions)."""
        response = self.client.models.embed_content(
            model=self.model_name,
            contents=text,
            config=types.EmbedContentConfig(
                output_dimensionality=self.dimensions,
            ),
        )
        return response.embeddings[0].values

    async def generate_embedding_async(self, text: str) -> list[float]:
        """Async version for the context builder (ticket 5.5)."""
        response = await self.client.aio.models.embed_content(
            model=self.model_name,
            contents=text,
            config=types.EmbedContentConfig(
                output_dimensionality=self.dimensions,
            ),
        )
        return response.embeddings[0].values
