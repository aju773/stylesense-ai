from collections.abc import AsyncGenerator
from typing import override

from google import genai
from google.genai import types
from google.genai.errors import ClientError, ServerError

from apps.chat.services.exceptions import (
    AIProviderPermanentError,
    AIProviderTransientError,
)

from .base import BaseAIProvider


class GeminiProvider(BaseAIProvider):
    """Gemini AI provider — translates OpenAI message format to google-genai SDK."""

    def __init__(self, api_key: str, model_name: str = "gemini-3.5-flash"):
        super().__init__(api_key=api_key, model_name=model_name)
        self.client = genai.Client(api_key=self.api_key)

    def _translate_messages(
        self, messages: list[dict]
    ) -> tuple[list[types.Content], str | None]:
        """Split messages into Gemini contents + system instruction.
        Returns:
            (contents, system_instruction)
        """
        system_parts = []
        contents = []
        for msg in messages:
            role = msg["role"]
            text = msg["content"]
            if role == "system":
                system_parts.append(text)
            else:
                gemini_role = "model" if role == "assistant" else "user"
                contents.append(
                    types.Content(
                        role=gemini_role,
                        parts=[types.Part.from_text(text=text)],
                    )
                )
        system_instruction = "\n\n".join(system_parts) if system_parts else None
        return contents, system_instruction

    @override
    async def generate_completion(
        self,
        messages: list[dict],
        temperature: float = 0.7,
    ) -> str:
        contents, system_instruction = self._translate_messages(messages)
        config = types.GenerateContentConfig(
            temperature=temperature,
        )
        if system_instruction:
            config.system_instruction = system_instruction

        try:
            response = await self.client.aio.models.generate_content(
                model=self.model_name,
                contents=contents,
                config=config,
            )
            return response.text
        except ServerError as e:
            raise AIProviderTransientError(f"Gemini server error: {e}") from e
        except ClientError as e:
            if e.code == 429:
                raise AIProviderTransientError(f"Gemini rate limited: {e}") from e
            raise AIProviderPermanentError(f"Gemini client error: {e}") from e

    @override
    async def generate_completion_stream(
        self,
        messages: list[dict],
        temperature: float = 0.7,
    ) -> AsyncGenerator[str]:
        contents, system_instruction = self._translate_messages(messages)
        config = types.GenerateContentConfig(
            temperature=temperature,
        )
        if system_instruction:
            config.system_instruction = system_instruction
        try:
            response = await self.client.aio.models.generate_content_stream(
                model=self.model_name,
                contents=contents,
                config=config,
            )
            async for chunk in response:
                if chunk.text:
                    yield chunk.text
        except ServerError as e:
            raise AIProviderTransientError(f"Gemini server error: {e}") from e
        except ClientError as e:
            if e.code == 429:
                raise AIProviderTransientError(f"Gemini rate limited: {e}") from e
            raise AIProviderPermanentError(f"Gemini client error: {e}") from e
