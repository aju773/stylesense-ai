# AI Provider Strategy Pattern & Architecture in Python/Django

## Executive Summary
This document investigates architectural best practices for abstracting AI providers (e.g., OpenAI, Anthropic, Gemini, local models) in Python 3.13+ and Django 5/6 using the Strategy and Fallback Orchestrator patterns. It covers interface definition via Abstract Base Classes (`abc.ABC`) versus `typing.Protocol`, resilient fallback error handling, Django service layer conventions, async streaming capabilities, and settings-driven dependency injection for effortless testing.

---

## 1. Abstract Base Class (`abc.ABC`) in Python 3.13+

### Defining Abstract Interfaces
In Python 3.13+, Abstract Base Classes (`abc.ABC`) combined with `@abstractmethod` remain the standard mechanism for defining rigid, nominal type hierarchies. 

### Modern Python Features (PEP 698 `@override`)
Introduced in Python 3.12 (PEP 698) and standard in Python 3.13, the `typing.override` decorator explicitly marks overridden methods in subclasses. Static type checkers (`mypy`, `pyright`) verify that decorated methods actually match a signature in the parent class, catching method name typos or signature mismatches at build time.

### Structured Request & Response Payloads
Using immutable `@dataclass(frozen=True)` or Pydantic models for inputs and outputs decouples the core domain logic from provider-specific SDK payloads.

### Code Example: Abstract Interface & Implementation

```python
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import AsyncGenerator, Optional, override

@dataclass(frozen=True)
class AICompletionRequest:
    prompt: str
    max_tokens: int = 500
    temperature: float = 0.7
    system_instruction: Optional[str] = None

@dataclass(frozen=True)
class AICompletionResponse:
    content: str
    provider_name: str
    model_name: str
    tokens_used: int

class BaseAIProvider(ABC):
    """Abstract interface for all AI provider implementations."""

    def __init__(self, api_key: str, timeout: float = 10.0) -> None:
        self.api_key = api_key
        self.timeout = timeout

    @abstractmethod
    async def generate_completion(self, request: AICompletionRequest) -> AICompletionResponse:
        """Generate a complete text response asynchronously."""
        pass

    @abstractmethod
    async def stream_completion(self, request: AICompletionRequest) -> AsyncGenerator[str, None]:
        """Stream response tokens asynchronously."""
        pass


class OpenAIProvider(BaseAIProvider):
    """Concrete OpenAI provider implementation."""

    def __init__(self, api_key: str, model_name: str = "gpt-4o") -> None:
        super().__init__(api_key=api_key)
        self.model_name = model_name

    @override
    async def generate_completion(self, request: AICompletionRequest) -> AICompletionResponse:
        # SDK invocation logic goes here
        return AICompletionResponse(
            content="Synthetic AI output",
            provider_name="OpenAI",
            model_name=self.model_name,
            tokens_used=42,
        )

    @override
    async def stream_completion(self, request: AICompletionRequest) -> AsyncGenerator[str, None]:
        tokens = ["Synthetic ", "AI ", "output ", "stream."]
        for token in tokens:
            yield token
```

**Primary Sources:**
- [Python 3.13 `abc` Module Documentation](https://docs.python.org/3.13/library/abc.html)
- [PEP 698 – Override Decorator for Static Typing](https://peps.python.org/pep-0698/)

---

## 2. Interface Design: `typing.Protocol` vs `abc.ABC`

### Structural vs. Nominal Subtyping
- **`abc.ABC` (Nominal Subtyping)**: Requires concrete provider classes to explicitly inherit from `BaseAIProvider`. Inheritance forms an explicit "is-a" relationship.
- **`typing.Protocol` (Structural Subtyping / Duck Typing)**: Defined via PEP 544. Any class implementing matching methods (`generate_completion`, `stream_completion`) satisfies the interface without inheriting from a common base class.

### Tradeoff Comparison

| Feature / Aspect | `abc.ABC` (Nominal) | `typing.Protocol` (Structural) |
| :--- | :--- | :--- |
| **Inheritance Requirement** | Required (`class OpenAIProvider(BaseAIProvider)`) | Not required (Implicit satisfaction) |
| **Runtime Enforcement** | Prevents instantiation if methods are missing (`TypeError`) | Type-checker only (unless `@runtime_checkable` is used with `isinstance`) |
| **Code Reuse** | Excellent for base constructors, default timeouts, logging helpers | Interface contract only; no default state/method sharing |
| **Third-Party Integration** | Third-party classes must wrap or inherit from Base class | Third-party classes fit immediately without modification |
| **Coupling** | Tighter domain coupling | Loosely coupled |

### 2026 Pythonic Consensus & Recommendation
- **Use `typing.Protocol`** when building public libraries, framework plugin APIs, or accepting third-party client objects where you cannot dictate class inheritance.
- **Use `abc.ABC` (or a hybrid base class)** for internal service domain layers (such as AI provider abstractions in a Django application). ABCs provide clear inheritance rules, allow sharing base configuration (`api_key`, `timeout`, retry logic), and catch missing method implementations at instantiation time.

**Primary Sources:**
- [Python 3.13 `typing.Protocol` Documentation](https://docs.python.org/3.13/library/typing.html#typing.Protocol)
- [PEP 544 – Interfaces via Structural Subtyping](https://peps.python.org/pep-0544/)

---

## 3. Fallback & Orchestrator Strategy Pattern

### Implementation Strategy
The orchestrator attempts to fulfill AI requests using a primary provider. If the primary provider fails due to a recoverable transient network error, rate limit, or service degradation, the orchestrator logs a warning and falls back to a secondary provider.

### Exception Handling Rules
1. **Never catch `Exception` broadly**: Catching generic `Exception` swallows bugs (e.g., `AttributeError`, `NameError`, `KeyError`) and non-recoverable errors.
2. **Distinguish Transient vs. Permanent Errors**:
   - **Transient Errors** (Catch & Fallback): `httpx.TimeoutException`, `openai.APIConnectionError`, HTTP 502/503/504 status codes, rate limits (HTTP 429).
   - **Permanent Errors** (Do NOT Fallback): Invalid API keys (HTTP 401), invalid prompt/request parameters (HTTP 400), context window length exceeded. Fallbacks will fail with identical errors.

### Circuit Breakers: Are They Overkill?
- **Simple Fallback + Strict Timeouts**: Sufficient for most small to medium Django applications. Keep request timeouts short (e.g., 5-10 seconds per attempt).
- **Circuit Breaker (`pybreaker` or `aiobreaker`)**: Necessary when request volume is high. If Provider A suffers a 30-minute outage, a circuit breaker "trips" open instantly, bypassing Provider A without waiting for 10-second request timeouts on every single user request.

### Code Example: Resilient Orchestrator

```python
import logging
from typing import AsyncGenerator, List
from apps.ai_stylist.exceptions import (
    AIProviderPermanentError,
    AIProviderTransientError,
)

logger = logging.getLogger(__name__)

class AIProviderOrchestrator:
    """Orchestrates AI requests across primary and fallback providers."""

    def __init__(self, providers: List[BaseAIProvider]) -> None:
        if not providers:
            raise ValueError("AIProviderOrchestrator requires at least one provider.")
        self.providers = providers

    async def generate_completion(self, request: AICompletionRequest) -> AICompletionResponse:
        last_exception: Exception | None = None

        for index, provider in enumerate(self.providers):
            provider_name = provider.__class__.__name__
            try:
                logger.info(f"Dispatching AI request to provider: {provider_name}")
                response = await provider.generate_completion(request)
                return response

            except (AIProviderTransientError, TimeoutError, ConnectionError) as exc:
                last_exception = exc
                logger.warning(
                    f"Provider '{provider_name}' failed with transient error: {exc}. "
                    f"Initiating fallback (Attempt {index + 1}/{len(self.providers)})."
                )

            except AIProviderPermanentError as exc:
                logger.error(
                    f"Permanent error encountered on '{provider_name}': {exc}. Aborting fallback chain."
                )
                raise exc

        logger.critical("All configured AI providers failed.")
        raise RuntimeError("AI service unavailable.") from last_exception
```

**Primary Sources:**
- [OpenAI Python SDK Error Handling Guidelines](https://github.com/openai/openai-python#handling-errors)
- [Python `logging` Module Best Practices](https://docs.python.org/3/library/logging.html)
- [Martin Fowler – Circuit Breaker Pattern](https://martinfowler.com/bliki/CircuitBreaker.html)

---

## 4. Django Service Layer Conventions

### Where Business Logic Belongs
Django's built-in convention advocates for "fat models, thin views." However, complex integrations like AI provider orchestration, payments, and multi-model workflows overload models and views.

### HackSoft Django Styleguide Pattern
The standard Django community architecture pattern (promoted by the *HackSoft Django Styleguide* and *Architecture Patterns with Python*) introduces two distinct layers:
1. **Services (`services/`)**: Responsible for operations that mutate data or coordinate external side effects (AI API calls, sending emails, processing payments).
2. **Selectors (`selectors/`)**: Responsible for complex database read operations and queries.

### Recommended Directory Structure
In a modular Django app structure (e.g. `apps/ai_stylist`), logic is organized as follows:

```
backend/
├── apps/
│   └── ai_stylist/
│       ├── services/
│       │   ├── __init__.py
│       │   ├── ai_orchestrator.py
│       │   ├── stylist_service.py
│       │   └── providers/
│       │       ├── base.py
│       │       ├── openai_provider.py
│       │       ├── anthropic_provider.py
│       │       └── mock_provider.py
│       ├── selectors/
│       │   └── recommendation_selectors.py
│       ├── views.py
│       └── models.py
```

### Key Principles
- **Keep Views Thin**: Views parse HTTP input, call a service function, and return serialized responses.
- **Pure Python Functions**: Service functions accept plain Python types or dataclasses, making them executable from Django views, Celery tasks, management commands, or CLI scripts without duplication.

**Primary Sources:**
- [HackSoft Django Styleguide](https://github.com/HackSoft/Django-Styleguide)
- [Architecture Patterns with Python (Cosmic Python)](https://www.cosmicpython.com/)

---

## 5. Async Architecture in Django 6 & DRF

### Async Views & External AI SDKs
Because AI provider requests are purely I/O-bound HTTP calls that can take several seconds, handling them in synchronous WSGI threads blocks worker threads. Django 5/6 running under an ASGI server (such as Uvicorn or Daphne) allows non-blocking concurrency using `async def` views.

### Streaming AI Completions with `StreamingHttpResponse`
Django natively supports passing an `AsyncGenerator` to `StreamingHttpResponse` to stream response chunks to client applications (e.g., Server-Sent Events).

### DRF Concurrency Considerations
Django REST Framework (DRF) `APIView` historically operates synchronously.
- **Django Native / ASGI Views**: Best choice for SSE streaming endpoints.
- **ADRF (Async Django REST Framework)**: Lightweight package providing async `APIView` and `ViewSet` subclasses for full DRF serializer compatibility.
- **Database Operations in Async Views**: Django 5/6 and `psycopg 3` support native async ORM methods (`aget()`, `acreate()`, `afilter()`, `asave()`).

### Code Example: Async Django Streaming View

```python
from django.http import StreamingHttpResponse
from rest_framework.decorators import api_view
from rest_framework.request import Request
from apps.ai_stylist.services.factory import get_ai_orchestrator
from apps.ai_stylist.services.providers.base import AICompletionRequest

@api_view(["POST"])
def stream_outfit_recommendation(request: Request):
    """Streams AI recommendation tokens to the client."""
    user_prompt = request.data.get("prompt", "")
    orchestrator = get_ai_orchestrator()
    completion_req = AICompletionRequest(prompt=user_prompt)

    async def token_generator():
        async for token in orchestrator.stream_completion(completion_req):
            yield f"data: {token}\n\n"

    return StreamingHttpResponse(
        token_generator(),
        content_type="text/event-stream"
    )
```

**Primary Sources:**
- [Django Async Support Documentation](https://docs.djangoproject.com/en/5.0/topics/async/)
- [Django `StreamingHttpResponse` Documentation](https://docs.djangoproject.com/en/5.0/ref/request-response/#streaminghttpresponse-objects)
- [Async Django REST Framework (ADRF)](https://github.com/em1208/adrf)

---

## 6. Dependency Injection & Testability in Django

### Settings-Based Dynamic Provider Loading
Django provides `django.utils.module_loading.import_string` to dynamically instantiate classes defined as import paths in `settings.py`.

### Constructor Injection Pattern
Services accept provider instances via their constructor (`__init__`), defaulting to a factory function (`get_ai_orchestrator()`). This allows unit tests to inject a `MockAIProvider` directly without modifying settings or patching global variables.

### Implementation Example

```python
# settings.py
AI_PROVIDERS = [
    "apps.ai_stylist.services.providers.openai_provider.OpenAIProvider",
    "apps.ai_stylist.services.providers.anthropic_provider.AnthropicProvider",
]

# apps/ai_stylist/services/factory.py
from typing import List
from django.conf import settings
from django.utils.module_loading import import_string
from .providers.base import BaseAIProvider
from .ai_orchestrator import AIProviderOrchestrator

def get_configured_providers() -> List[BaseAIProvider]:
    providers = []
    for provider_path in settings.AI_PROVIDERS:
        provider_cls = import_string(provider_path)
        providers.append(provider_cls())
    return providers

def get_ai_orchestrator() -> AIProviderOrchestrator:
    return AIProviderOrchestrator(providers=get_configured_providers())
```

### Testing with `@override_settings` and Mock Providers

```python
from django.test import TestCase, override_settings
from apps.ai_stylist.services.factory import get_ai_orchestrator

@override_settings(
    AI_PROVIDERS=[
        "apps.ai_stylist.services.providers.mock_provider.MockAIProvider"
    ]
)
class AIOrchestratorTest(TestCase):
    async def test_orchestrator_uses_mock_provider(self):
        orchestrator = get_ai_orchestrator()
        self.assertEqual(len(orchestrator.providers), 1)
        self.assertEqual(orchestrator.providers[0].__class__.__name__, "MockAIProvider")
```

**Primary Sources:**
- [Django `import_string` Utility Documentation](https://docs.djangoproject.com/en/5.0/ref/utils/#django.utils.module_loading.import_string)
- [Django `@override_settings` Testing Documentation](https://docs.djangoproject.com/en/5.0/topics/testing/tools/#django.test.override_settings)

---

## 7. Summary Table & Key Recommendations

| Dimension | Best Practice Recommendation |
| :--- | :--- |
| **Interface Definition** | Use `abc.ABC` with `@abstractmethod` and `typing.override` (Python 3.12+) for internal domain interfaces. |
| **Protocol vs ABC** | Use `typing.Protocol` for broad library/plugin interfaces; use `abc.ABC` for internal service layers needing base code reuse and runtime checks. |
| **Fallback Strategy** | Catch specific transient exceptions (`TimeoutError`, HTTP 5xx/429), log warnings with structured context, and skip non-recoverable errors (HTTP 401/400). |
| **Service Layer** | Place business logic in `apps/<app_name>/services/` as clean Python functions/classes (HackSoft styleguide). |
| **Async & Streaming** | Use `async def` views with `StreamingHttpResponse` (and `adrf` or native ASGI views) for non-blocking token streaming. |
| **Dependency Injection** | Combine `django.conf.settings` + `import_string` with constructor injection for simple test mocking with `@override_settings`. |
