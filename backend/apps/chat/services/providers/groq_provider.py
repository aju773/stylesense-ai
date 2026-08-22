from collections.abc import AsyncGenerator
from typing import override

from groq import APIConnectionError, APIStatusError, AsyncGroq, RateLimitError

from apps.chat.services.exceptions import (
    AIProviderPermanentError,
    AIProviderTransientError,
)

from .base import BaseAIProvider


class GroqProvider(BaseAIProvider):
    """Groq AI provider — OpenAI-compatible, no message translation needed."""

    def __init__(self, api_key: str, model_name: str = "openai/gpt-oss-120b"):
        super().__init__(api_key=api_key, model_name=model_name)
        self.client = AsyncGroq(api_key=self.api_key)

    @override
    async def generate_completion(
        self,
        messages: list[dict],
        temperature: float = 0.7,
    ) -> str:
        try:
            response = await self.client.chat.completions.create(
                model=self.model_name,
                messages=messages,
                temperature=temperature,
            )
            return response.choices[0].message.content
        except (RateLimitError, APIConnectionError) as e:
            raise AIProviderTransientError(f"Groq transient error: {e}") from e
        except APIStatusError as e:
            raise AIProviderPermanentError(f"Groq error: {e}") from e

    @override
    async def generate_completion_stream(
        self,
        messages: list[dict],
        temperature: float = 0.7,
    ) -> AsyncGenerator[str]:
        try:
            stream = await self.client.chat.completions.create(
                model=self.model_name,
                messages=messages,
                temperature=temperature,
                stream=True,
            )
            async for chunk in stream:
                content = chunk.choices[0].delta.content
                if content:
                    yield content
        except (RateLimitError, APIConnectionError) as e:
            raise AIProviderTransientError(f"Groq transient error: {e}") from e
        except APIStatusError as e:
            raise AIProviderPermanentError(f"Groq error: {e}") from e
