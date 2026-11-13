# StyleSense AI

An AI shopping assistant for fashion e-commerce. Ask for what you want in plain
language — *"something for a summer wedding, under $150"* — and get real
products from the catalogue, retrieved by semantic similarity rather than
keyword matching, with the answer streaming back token by token.

**Live demo:** https://stylesense-ai-s5v8.onrender.com (free hosting, so the first load can take a minute to wake up)

![StyleSense AI](designs/page-home/screen.png)

---

## What it does

- **Semantic product search.** Product descriptions are embedded as 768-dimension
  vectors and stored in Postgres via `pgvector`. A query is embedded the same way
  and matched by cosine distance, so "something floaty for warm weather" finds
  relevant items without those words appearing in any description.
- **Streaming AI chat** over WebSockets, so responses appear as they are
  generated rather than after a multi-second pause.
- **Provider fallback.** Gemini is primary, Groq is the fallback. Transient
  failures fail over automatically; the chat stays up when one provider does not.
- **Catalogue browsing** with faceted filters, cursor pagination, and a product
  detail view.
- **Cookie-based JWT auth** with refresh-token rotation and blacklist-on-logout.

## Status

Actively being built. The catalogue, filtering, auth, and the AI backend
(embeddings, provider fallback, streaming, WebSocket consumer) are done. The
chat **UI** is the current ticket — see [`progress.md`](progress.md) for the
detailed state and [`planning/`](planning/) for the ticket breakdown.

---

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

### Why one container

The React bundle is built in a Docker stage and served by Django, so the SPA and
the API share an origin. That is not a shortcut — it is what keeps the auth
cookie on `SameSite=Lax`. Splitting the frontend onto its own domain would make
the cookie cross-site, requiring `SameSite=None`, which Safari and Brave block
by default as a third-party cookie. Logins would break for those users with no
error message worth reading.

### Why no Redis

Django Channels requires a channel layer, but `ChatConsumer` never uses
`group_send` or `group_add` — it streams only to the socket that asked. With a
single-process deployment the in-memory layer is sufficient, which removes an
entire service from the stack. This assumption is documented at the setting and
would need revisiting before scaling beyond one process.

### Why Neon rather than the platform's database

Render's free Postgres is deleted 30 days after creation. A portfolio link that
dies in a month is worse than no link. Neon's free tier has no expiry, supports
`pgvector`, and separates storage from compute so idle time costs nothing.

## Tech stack

**Backend** — Django 6, Django REST Framework, Channels + Daphne (ASGI),
Postgres 16 + pgvector, `google-genai`, `groq`, uv

**Frontend** — React 19, TypeScript, Vite, Tailwind CSS v4, TanStack Query,
React Router v8

**Infrastructure** — Docker (multi-stage), Render, Neon, GitHub Actions

---

## Running locally

Requires Docker, [uv](https://docs.astral.sh/uv/), and Node 22 with pnpm.

```bash
git clone https://github.com/<your-username>/stylesense-ai.git
cd stylesense-ai
```

**1. Start Postgres**

```bash
docker compose -f backend/compose.yml up -d
```

**2. Configure and migrate the backend**

```bash
cd backend
cp .env.example .env    # then fill in DJANGO_SECRET_KEY and your AI keys
uv sync
uv run python manage.py migrate
uv run python manage.py seed_products
uv run python manage.py seed_embeddings   # calls the Gemini API; idempotent
uv run python manage.py runserver
```

**3. Start the frontend**

```bash
cd frontend
pnpm install
pnpm dev
```

Open http://localhost:5173. Vite proxies `/api` and `/ws` to Django on `:8000`,
so development mirrors production's same-origin setup.

---

## Deployment

Push to `main`. Render builds the [`Dockerfile`](Dockerfile) per
[`render.yaml`](render.yaml), runs migrations and catalogue seeding as a
pre-deploy step, and routes traffic to the new container only once `/healthz`
answers — so a container that fails to boot leaves the previous version serving.

Embeddings are seeded separately, from a local machine pointed at the production
database. They are deliberately not part of the deploy: they call the Gemini API,
and a transient rate limit should not fail an unrelated deploy.

[`.github/workflows/ci.yml`](.github/workflows/ci.yml) runs lint, typecheck,
frontend build, Django's production `--deploy` checks, a missing-migration
check, and a Docker build on every push.

## Repository layout

| Path | Contents |
|---|---|
| `backend/` | Django project — `apps/{users,products,chat}`, split settings |
| `frontend/` | React + Vite SPA |
| `designs/` | Page designs (`screen.png` + `code.html` per page) |
| `docs/` | Architecture notes, decision log, integration research |
| `planning/` | Ticket breakdown / roadmap |
| `progress.md` | Current state and decision history |
