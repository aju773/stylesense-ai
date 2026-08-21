# syntax=docker/dockerfile:1

# Build context is the repo root, because a single image needs both trees:
# the React bundle is built here and then served by Django, which is what makes
# the SPA and the API same-origin in production.

# ---------------------------------------------------------------------------
# Stage 1 — build the React bundle
# ---------------------------------------------------------------------------
FROM node:22-alpine AS frontend

WORKDIR /app/frontend
RUN corepack enable

# Manifest and lockfile first, on their own layer. Dependencies change far less
# often than source, so this install is cached across the many builds where
# only application code moved.
COPY frontend/package.json frontend/pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY frontend/ ./
RUN pnpm build


# ---------------------------------------------------------------------------
# Stage 2 — Python runtime
# ---------------------------------------------------------------------------
FROM python:3.13-slim AS runtime

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    DJANGO_SETTINGS_MODULE=core.settings.production

# PYTHONUNBUFFERED above is load-bearing on Render: without it Python buffers
# stdout when it is a pipe rather than a terminal, and the log stream stays
# empty during exactly the crash you are trying to read.

# psycopg is installed without the [binary] extra, so it links against the
# system libpq at runtime. Missing it fails at connect time with an opaque
# "no pq wrapper available" rather than anything mentioning Postgres.
RUN apt-get update \
    && apt-get install --no-install-recommends -y libpq5 curl \
    && rm -rf /var/lib/apt/lists/*

COPY --from=ghcr.io/astral-sh/uv:0.9 /uv /usr/local/bin/uv

WORKDIR /app

# Same caching logic as the frontend stage: lockfile layer before source.
# --frozen refuses to silently resolve different versions than uv.lock pins,
# so a stale lockfile fails the build instead of shipping untested deps.
COPY backend/pyproject.toml backend/uv.lock ./
RUN uv sync --frozen --no-dev --no-install-project

COPY backend/ ./

# The Vite output lands where base.py's FRONTEND_DIST expects it. WhiteNoise
# serves this directory verbatim at the web root; it deliberately does not go
# through collectstatic (see the comment in base.py about double-hashing).
COPY --from=frontend /app/frontend/dist ./frontend_dist

ENV PATH="/app/.venv/bin:$PATH"

# collectstatic imports settings, and base.py requires DJANGO_SECRET_KEY with
# no fallback. This throwaway value exists only for this build step — it is
# never used to sign anything, and the real key arrives from the environment
# at runtime. Handling Django's admin assets only; the SPA is already in place.
RUN DJANGO_SECRET_KEY="build-time-only-not-a-real-secret" \
    python manage.py collectstatic --noinput --clear

# Run unprivileged. If the app is ever compromised, the attacker lands as a
# user that cannot write to the application code it is executing.
RUN useradd --create-home --uid 1000 appuser \
    && chown -R appuser:appuser /app
USER appuser

# Render injects PORT and routes to it. Documentation only — EXPOSE does not
# publish anything.
EXPOSE 10000

# Shell form so ${PORT} is expanded; Render sets it, 10000 is the local default.
# Daphne rather than gunicorn/uvicorn workers because this is an ASGI app
# serving WebSockets, and because the deployment is deliberately single-process
# (see the InMemoryChannelLayer note in base.py).
CMD daphne -b 0.0.0.0 -p ${PORT:-10000} core.asgi:application
