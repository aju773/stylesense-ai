# StyleSense AI

## Rules
- **Implement directly.** Write the code, run the commands. No mentor/teaching mode.
- **Modern Tooling Check.** Before using a setup or command, verify modern standard methods (e.g., uv over pip/venv) and align with user preferences.

## Workflow (Per Sub-ticket)
1. Implement
2. Verify it runs
3. Update `progress.md` when done

## Project Layout
- `progress.md` → Current ticket, completed list, recent decisions
- `docs/` → Architecture, decisions, seed data, interview prep
- `designs/` → Page designs (`screen.png` + `code.html` per page)
- `planning/stylesense-ai/issues/` → Tickets (roadmap)
- `backend/compose.yml` → Docker services for local dev (Postgres, Redis)

## Design Pages
| Page | Folder |
|---|---|
| Home / Landing | `designs/page-home` |
| Login | `designs/page-login` |
| Register | `designs/page-register` |
| Shop / Browse | `designs/page-shop` |
| Product Detail | `designs/page-product-detail` |
| AI Chat | `designs/page-ai-chat` |
| Cart | `designs/page-cart` |
| Wishlist | `designs/page-wishlist` |
| Orders | `designs/page-orders` |
| Profile | `designs/page-profile` |
| Design System | `designs/design-system` |

## AI Core Integration References
Read these **before** building the AI chatbot core (ticket 05):
- Gemini SDK (primary provider): `docs/research-gemini-integration.md`
  - Package: `google-genai` (NOT the deprecated `google-generativeai`)
  - Async: `client.aio.models.generate_content()` / `generate_content_stream()`
  - Chat history: `client.aio.chats.create(model=..., history=...)`
  - Errors: `google.genai.errors.APIError` (`.code` for HTTP status)
- Groq SDK (fallback provider): `docs/research-groq-integration.md`
  - Package: `groq` — OpenAI-compatible API (`messages` format)
  - Async: `AsyncGroq` client
  - Errors: `groq.RateLimitError`, `groq.APIConnectionError`, etc.
- Strategy pattern & architecture: `docs/research-ai-strategy-pattern.md`
  - Use `abc.ABC` + `@abstractmethod` for provider interface
  - Fallback orchestrator: catch transient errors only, never broad `Exception`
  - Service layer: `apps/<app>/services/` (HackSoft Django Styleguide)
  - DI: `django.utils.module_loading.import_string` + `settings.AI_PROVIDERS`
- Vector search (RAG): `docs/research-pgvector-embeddings.md`
  - Docker image: `pgvector/pgvector:pg16` (replaces plain `postgres:16`)
  - Django: `pgvector` package → `VectorField(dimensions=768)` + `HnswIndex`
  - Embeddings: `client.aio.models.embed_content(model="text-embedding-004")`
  - Search: `CosineDistance("embedding", query_vector)` via Django ORM

## Key References
- Spec: `docs/` (see `project_readme.md` for overview)
- Decisions: `docs/decision_log.md`
- Design tokens: `designs/design-system/DESIGN.md`
