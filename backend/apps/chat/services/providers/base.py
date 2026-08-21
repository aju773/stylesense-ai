from abc import ABC, abstractmethod
from collections.abc import AsyncGenerator


class BaseAIProvider(ABC):
    """Abstract interface for AI provider implementations."""

    def __init__(self, api_key: str, model_name: str):
        self.api_key = api_key
        self.model_name = model_name

    @abstractmethod
    async def generate_completion(
        self,
        messages: list[dict],
        temperature: float = 0.7,
    ) -> str:
        """Generate a complete text response from a message list.
        ...existing docstring...
        """

    @abstractmethod
    async def generate_completion_stream(
        self,
        messages: list[dict],
        temperature: float = 0.7,
    ) -> AsyncGenerator[str]:
        """Yield response tokens as they arrive from the AI provider.
        Args:
            messages: OpenAI-format messages.
            temperature: Creativity control (0.0–1.0).
        Yields:
            Text chunks as the model generates them.
        """
        yield  # pragma: no cover
