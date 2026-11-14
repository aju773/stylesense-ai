# StyleSense AI

An AI shopping assistant for a fashion store. You describe what you want in
plain language, like *"something light for a summer wedding, under ₹5,000"*,
and it answers with real products from the catalogue, found by semantic
similarity, with the reply streaming in as it is generated.

Live demo: https://stylesense-ai-s5v8.onrender.com (free hosting, so the first
load can take a minute to wake up)

[![StyleSense AI demo](docs/demo/demo.gif)](docs/demo/demo.mp4)

The demo shows catalogue filtering, adding to the bag, and an AI stylist
request. Click it for the full-quality MP4.

## What it does

- Semantic product search. Product descriptions are embedded as 768-dimension
  vectors in Postgres with `pgvector`. A query is embedded the same way and
  matched by cosine distance, so "something floaty for warm weather" finds
  relevant items even when those words appear in no description.
- Streaming chat over WebSockets.
- Provider fallback: Gemini first, Groq when Gemini has a transient failure.
- Catalogue browsing with faceted filters, cursor pagination, and product pages.
- Cookie-based JWT auth with refresh-token rotation and blacklist on logout.

## Architecture

```
                         ┌─────────────────────────────┐
   Browser ──── HTTPS ──▶│  Render (single container)  │
            └─ WSS ─────▶│                             │
                         │  Daphne (ASGI)              │
                         │   ├─ /          React SPA   │  ← same origin
                         │   ├─ /api/      DRF         │
                         │   └─ /ws/chat/  Channels    │
                         └──────────────┬──────────────┘
                                        │
                          ┌─────────────▼─────────────┐
                          │ Neon Postgres + pgvector  │
                          └───────────────────────────┘
                                        │
                          ┌─────────────▼─────────────┐
                          │  Gemini  →  Groq fallback │
                          └───────────────────────────┘
```

### Trade-offs

| Choice | Why | Cost |
|---|---|---|
| One container serving the SPA and API | Same origin keeps the auth cookie on `SameSite=Lax`. A separate frontend domain would need `SameSite=None`, which Safari and Brave block as a third-party cookie. | Frontend and backend deploy together. |
| No Redis | `ChatConsumer` streams only to the socket that asked and never uses groups, so the in-memory channel layer is enough. | Must change before running more than one process. |
| Neon instead of Render Postgres | Render's free database is deleted after 30 days. Neon's free tier doesn't expire and supports `pgvector`. | One more provider to manage. |

## Tech stack

- Backend: Django 6, DRF, Channels + Daphne, Postgres 16 + pgvector, `google-genai`, `groq`, uv
- Frontend: React 19, TypeScript, Vite, Tailwind CSS v4, TanStack Query, React Router
- Infrastructure: Docker (multi-stage), Render, Neon, GitHub Actions

## Running locally

Requires Docker, [uv](https://docs.astral.sh/uv/), and Node 22 with pnpm.

```bash
git clone https://github.com/aju773/stylesense-ai.git
cd stylesense-ai
docker compose -f backend/compose.yml up -d    # Postgres + pgvector
```

Backend:

```bash
cd backend
cp .env.example .env    # then fill in DJANGO_SECRET_KEY and your AI keys
uv sync
uv run python manage.py migrate
uv run python manage.py seed_products
uv run python manage.py seed_embeddings   # calls the Gemini API; idempotent
uv run python manage.py runserver
```

Frontend:

```bash
cd frontend
pnpm install
pnpm dev
```

Open http://localhost:5173. Vite proxies `/api` and `/ws` to Django on `:8000`,
the same single-origin setup as production.

## Deployment

Pushing to `main` deploys. Render builds the [`Dockerfile`](Dockerfile) per
[`render.yaml`](render.yaml), runs migrations and catalogue seeding before the
switch, and only routes traffic once `/healthz` answers, so a container that
fails to boot leaves the previous version serving.

Embeddings are seeded by hand from a local machine pointed at the production
database. They call the Gemini API, and a rate limit there shouldn't fail an
unrelated deploy.

[CI](.github/workflows/ci.yml) runs lint, typecheck, the frontend build,
Django's `--deploy` checks, a missing-migration check, and a Docker build on
every push.
