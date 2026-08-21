import logging
from collections.abc import AsyncGenerator

from .exceptions import AIProviderPermanentError, AIProviderTransientError
from .providers.base import BaseAIProvider

logger = logging.getLogger(__name__)


class AIProviderOrchestrator:
    """Tries providers in order, falling back on transient errors."""

    def __init__(self, providers: list[BaseAIProvider]):
        if not providers:
            raise ValueError("At least one AI provider is required.")
        self.providers = providers

    async def generate_completion(
        self,
        messages: list[dict],
        temperature: float = 0.7,
    ) -> str:
        last_error: Exception | None = None
        for i, provider in enumerate(self.providers, 1):
            name = provider.__class__.__name__
            try:
                logger.info("Trying provider %s (%d/%d)", name, i, len(self.providers))
                return await provider.generate_completion(messages, temperature)
            except AIProviderTransientError as e:
                last_error = e
                logger.warning(
                    "Provider %s failed (transient): %s. Trying next.", name, e
                )
            except AIProviderPermanentError:
                logger.error("Provider %s failed (permanent). Aborting.", name)
                raise
        raise RuntimeError("All AI providers failed.") from last_error

    async def generate_completion_stream(
        self,
        messages: list[dict],
        temperature: float = 0.7,
    ) -> AsyncGenerator[str]:
        last_error: Exception | None = None
        for i, provider in enumerate(self.providers, 1):
            name = provider.__class__.__name__
            try:
                logger.info(
                    "Trying provider %s (%d/%d) [stream]", name, i, len(self.providers)
                )
                async for chunk in provider.generate_completion_stream(
                    messages, temperature
                ):
                    yield chunk
                return  # stream completed successfully
            except AIProviderTransientError as e:
                last_error = e
                logger.warning(
                    "Provider %s failed (transient): %s. Trying next.", name, e
                )
            except AIProviderPermanentError:
                logger.error("Provider %s failed (permanent). Aborting.", name)
                raise
        raise RuntimeError("All AI providers failed.") from last_error
