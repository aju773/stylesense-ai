# Groq API Integration Guide for Python / Django Backend

This document details the specifications, integration patterns, and best practices for integrating the Groq API into a Python/Django backend architecture using primary official sources.

---

## 1. Official Python SDK & Package Information

* **Package Name:** `groq`
* **PyPI URL:** [https://pypi.org/project/groq/](https://pypi.org/project/groq/)
* **Official GitHub Repository:** [https://github.com/groq/groq-python](https://github.com/groq/groq-python)
* **Latest Version:** `1.2.0` (as of PyPI metadata)
* **Python Runtime Requirement:** Python **3.10+** (Python 3.10, 3.11, 3.12, 3.13)

### Installation
Using standard modern Python package managers:

```bash
# Using uv (Recommended modern tool)
uv add groq

# Using pip
pip install groq
```

---

## 2. Basic Non-Streaming Usage

To initialize the Groq client and request a completion synchronously:

* **Official Source:** [groq-python GitHub README](https://github.com/groq/groq-python)

```python
import os
from groq import Groq

# The SDK automatically reads the GROQ_API_KEY environment variable if api_key is omitted.
client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

completion = client.chat.completions.create(
    model="llama-3.3-70b-versatile",
    messages=[
        {"role": "user", "content": "Explain quantum computing in simple terms."}
    ],
    temperature=0.7,
    max_tokens=1024,
)

# Extract response text
response_text = completion.choices[0].message.content
print(response_text)

# Token usage metadata
print(f"Prompt Tokens: {completion.usage.prompt_tokens}")
print(f"Completion Tokens: {completion.usage.completion_tokens}")
print(f"Total Tokens: {completion.usage.total_tokens}")
```

---

## 3. Streaming API Usage (Token-by-Token)

Streaming allows receiving response tokens in real time via Server-Sent Events (SSE), reducing Time-To-First-Token (TTFT).

* **Official Source:** [Groq Documentation - Text Generation](https://console.groq.com/docs/text-chat)

```python
import os
from groq import Groq

client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

stream = client.chat.completions.create(
    model="llama-3.3-70b-versatile",
    messages=[
        {"role": "user", "content": "Write a short poem about low latency."}
    ],
    stream=True,  # Enable streaming
)

for chunk in stream:
    # Access delta content (can be None on final or metadata chunks)
    content = chunk.choices[0].delta.content
    if content is not None:
        print(content, end="", flush=True)
```

---

## 4. System Prompts & System Instructions

System prompts instruct the LLM on persona, constraints, and output formatting. They are passed as the first message in the `messages` payload with `"role": "system"`.

* **Official Source:** [Groq Documentation - Chat Completion Format](https://console.groq.com/docs/text-chat)

```python
from groq import Groq

client = Groq()

messages = [
    {
        "role": "system",
        "content": "You are StyleSense AI, an expert high-fashion stylist. Provide direct, highly structured fashion advice."
    },
    {
        "role": "user",
        "content": "What should I wear to a tech conference panel?"
    }
]

response = client.chat.completions.create(
    model="llama-3.3-70b-versatile",
    messages=messages,
)

print(response.choices[0].message.content)
```

---

## 5. Multi-Turn Conversation (Chat History)

To maintain conversation history across multiple turns, send an ordered list of message dictionaries with roles `"system"`, `"user"`, and `"assistant"`.

* **Official Source:** [Groq Documentation - Chat Completions](https://console.groq.com/docs/text-chat)

```python
from groq import Groq

client = Groq()

chat_history = [
    {"role": "system", "content": "You are a helpful Django backend coding mentor."},
    {"role": "user", "content": "How do I define a custom User model in Django?"},
    {"role": "assistant", "content": "To define a custom User model in Django, subclass AbstractUser..."},
    {"role": "user", "content": "Can you show me the code for settings.py configuration?"}
]

response = client.chat.completions.create(
    model="llama-3.1-8b-instant",
    messages=chat_history,
)

# Append assistant's response to maintain conversation history
chat_history.append({"role": "assistant", "content": response.choices[0].message.content})
```

---

## 6. Available Production Models

Groq hosts high-speed open-weights models on custom LPU (Language Processing Unit) hardware.

* **Official Source:** [Groq Supported Models](https://console.groq.com/docs/models)

| Model Name | Model ID | Context Window | Use Case / Strengths |
|---|---|---|---|
| Meta Llama 3.3 70B | `llama-3.3-70b-versatile` | 128,000 tokens | Production standard for reasoning, coding, & instruction following |
| Meta Llama 3.1 8B | `llama-3.1-8b-instant` | 128,000 tokens | Ultra-low latency, high throughput, simple tasks |
| DeepSeek R1 Distill Llama 70B | `deepseek-r1-distill-llama-70b` | 128,000 tokens | Advanced mathematical, logical, & code reasoning |
| DeepSeek R1 Distill Qwen 32B | `deepseek-r1-distill-qwen-32b` | 128,000 tokens | Compact reasoning model |
| Mistral Mixtral 8x7B | `mixtral-8x7b-32768` | 32,768 tokens | Mixture-of-Experts versatile task handling |
| Google Gemma 2 9B | `gemma2-9b-it` | 8,192 tokens | Lightweight Google model |
| Whisper Large v3 | `whisper-large-v3` | N/A (Audio) | Multilingual speech-to-text transcription |
| Whisper Large v3 Turbo | `whisper-large-v3-turbo` | N/A (Audio) | High-speed audio transcription |

---

## 7. Error Handling & Exception Hierarchy

All Groq SDK exceptions inherit from `groq.APIError`. The SDK includes default automatic retries for transient errors.

* **Official Source:** [groq-python Exception Definitions](https://github.com/groq/groq-python#errors)

### SDK Error Class Taxonomy
* `groq.APIError` (Base exception)
  * `groq.APIConnectionError` (Network dropouts, timeouts, DNS failures)
  * `groq.APIStatusError` (HTTP 4xx / 5xx responses)
    * `groq.BadRequestError` (HTTP 400 - Invalid parameters / schema)
    * `groq.AuthenticationError` (HTTP 401 - Invalid API key)
    * `groq.PermissionDeniedError` (HTTP 403 - Missing access rights)
    * `groq.NotFoundError` (HTTP 404 - Invalid model ID or endpoint)
    * `groq.UnprocessableEntityError` (HTTP 422 - Format error)
    * `groq.RateLimitError` (HTTP 429 - Rate limit reached)
    * `groq.InternalServerError` (HTTP 500+ - Groq server issues)

### Automatic Retries
The SDK automatically performs **2 retries** by default with exponential backoff for:
* Connection errors (`groq.APIConnectionError`)
* HTTP 408 Timeout, 409 Conflict, 429 Rate Limit
* Internal Server Errors (≥500)

### Production Error Handling Code Pattern

```python
import groq
from groq import Groq

client = Groq()

try:
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": "Hello"}],
    )
except groq.APIConnectionError as e:
    print(f"Network connection failed: {e}")
except groq.RateLimitError as e:
    print(f"Rate limit exceeded (HTTP 429). Retry-after header advice should be observed: {e}")
except groq.APIStatusError as e:
    print(f"Groq API returned HTTP status {e.status_code}: {e.response}")
except groq.APIError as e:
    print(f"Fatal Groq SDK error: {e}")
```

---

## 8. API Key Management & Django Integration

* **Official Source:** [Groq API Key Setup](https://console.groq.com/keys)

### Recommended Configuration
Store the Groq API key in your `.env` file and read it via Django settings:

```env
# .env file
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

```python
# settings.py
import os

GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "")
```

### Initializing Client in Django Views / Services

```python
# services/llm_service.py
from django.conf import settings
from groq import Groq

def get_groq_client() -> Groq:
    if not settings.GROQ_API_KEY:
        raise ValueError("GROQ_API_KEY is missing from environment settings.")
    return Groq(api_key=settings.GROQ_API_KEY)
```

---

## 9. Free Tier Rate Limits

Limits are enforced **organization-wide** across four dimensions: RPM, RPD, TPM, and TPD. Hitting *any* limit results in a `429 Too Many Requests` error.

* **Official Source:** [Groq Rate Limits Documentation](https://console.groq.com/docs/rate-limits)

### Rate Limit Dimensions
* **RPM:** Requests Per Minute (60-second sliding window)
* **RPD:** Requests Per Day (24-hour sliding window)
* **TPM:** Tokens Per Minute (Input + Output tokens in 60s)
* **TPD:** Tokens Per Day (24-hour token allowance)

### Representative Free Tier Quotas

| Model | RPM | RPD | TPM | TPD |
|---|---|---|---|---|
| `llama-3.1-8b-instant` | 30 | 14,400 | 6,000 | 500,000 |
| `llama-3.3-70b-versatile` | 30 | 1,000 | 14,400 | 100,000 |
| `mixtral-8x7b-32768` | 30 | 14,400 | 5,000 | 500,000 |

*Note: Prompt tokens that hit cache do not count against rate limits.*

### Response Headers for Limit Tracking
Groq includes rate limit tracking headers in all HTTP responses:
* `x-ratelimit-remaining-requests`: Remaining request quota
* `x-ratelimit-remaining-tokens`: Remaining token quota
* `retry-after`: Seconds to wait when HTTP 429 occurs

---

## 10. Async/Await Support (`AsyncGroq`)

The SDK provides an asynchronous client `AsyncGroq` for high-concurrency applications, fully compatible with Django 4.x+ Async Views and ASGI.

* **Official Source:** [groq-python Async Usage](https://github.com/groq/groq-python#async-usage)

### Non-Streaming Async Call
```python
import os
import asyncio
from groq import AsyncGroq

async_client = AsyncGroq(api_key=os.environ.get("GROQ_API_KEY"))

async def fetch_stylist_advice(prompt: str) -> str:
    response = await async_client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
    )
    return response.choices[0].message.content
```

### Streaming Async Call
```python
async def stream_stylist_advice(prompt: str):
    stream = await async_client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        stream=True,
    )
    async for chunk in stream:
        content = chunk.choices[0].delta.content
        if content:
            yield content
```

---

## 11. OpenAI Compatibility & Strategy Pattern Architecture

Groq's REST API is **100% wire-compatible with OpenAI's Chat Completions standard**. You can use the official `openai` Python SDK directly by redirecting `base_url` to Groq's endpoint.

* **Official Source:** [Groq OpenAI Compatibility Guide](https://console.groq.com/docs/openai-compatibility)

### Using OpenAI Python Client with Groq Endpoint
```python
import os
from openai import OpenAI

# Initialize standard OpenAI client configured for Groq
client = OpenAI(
    base_url="https://api.groq.com/openai/v1",
    api_key=os.environ.get("GROQ_API_KEY")
)

response = client.chat.completions.create(
    model="llama-3.3-70b-versatile",
    messages=[{"role": "user", "content": "Hello from OpenAI SDK!"}],
)

print(response.choices[0].message.content)
```

### Strategic Value for Strategy Pattern / Provider Abstraction
Because Groq shares OpenAI's request schemas (`messages`, `temperature`, `max_tokens`, `stream`), response objects (`choices[0].message.content`, `usage`), and exception structures:

1. **Zero-Lock-in Strategy Pattern:** You can create an `LLMProvider` interface in your Django application with concrete subclasses (`GroqProvider`, `OpenAIProvider`, `OllamaProvider`).
2. **Seamless Fallback:** Switching from OpenAI to Groq or failing over if rate limits hit requires only changing the `base_url`, `api_key`, and `model` parameter, without refactoring payload builders or parsing code.
