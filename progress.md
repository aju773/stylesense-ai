# Progress

## Current
- Epic 06: Real-time AI Chat (WebSocket Streaming)
- Sub-ticket 6.4: React Chat UI + WebSocket Hook

## Completed
- Sub-ticket 1.1: Docker DBs
- Sub-ticket 1.2: Django Project Initialization
- Sub-ticket 1.3: React/Vite Initialization (Tailwind v4)
- Sub-ticket 1.4: Infrastructure Wiring
- Sub-ticket 2.1: Custom User Model
- Sub-ticket 2.2: JWT Auth Endpoints
- Sub-ticket 2.3: React Auth Plumbing
- Sub-ticket 2.4: Login & Register UI
- Sub-ticket 3.1: Django Product Models + Seed Data
- Sub-ticket 3.2: Products REST API
- Sub-ticket 3.3: React Product Grid + Card UI
- Sub-ticket 3.4: Bare-bones Product Detail Page
- Sub-ticket 4.1: Backend Filtering (django-filter)
- Sub-ticket 4.2: Frontend Filter Sidebar
- Sub-ticket 4.3: Product Detail UI Upgrade (ImageGallery, zoom, selectors)
- Sub-ticket 4.4: Polish (mobile drawer, debounce, filter chips)
- Sub-ticket 5.1: pgvector Docker + Product Embeddings
- Sub-ticket 5.2: AI Provider Interface + Gemini Provider
- Sub-ticket 5.3: Groq Fallback Provider + Orchestrator
- Sub-ticket 5.4: Conversation + ChatMessage Models
- Sub-ticket 5.5: Context Builder (Vector Search)
- Sub-ticket 5.6: System Prompt + Chat Service
- Sub-ticket 5.7: REST Chat Endpoints + Throttling
- Sub-ticket 6.1: Django Channels + WebSocket Plumbing
- Sub-ticket 6.2: Streaming Provider + ChatService (fixed indentation bug, unified `send_message_stream` event envelope, verified via `test_stream`)
- Sub-ticket 6.3: Wire Streaming into WebSocket Consumer (real `chat.message` handling, background-task + send-lock streaming, working concurrency guard and rate limiting, verified end-to-end)

## Recent Decisions
- Use `uv` for modern Python package management
- One conversation per sub-ticket
- Just-in-time slicing
- Mentor-only mode (sensei)
- Use Tailwind CSS v4 with Vite via `@tailwindcss/vite` (No config file)
- HttpOnly cookies for JWT (not localStorage)
- Token rotation + blacklisting on logout
- React Router v8 (was v7 at plan time, v8 is current)
- TanStack Query for server-state (useInfiniteQuery for paginated lists, useQuery for single resources)
- Cursor pagination over offset — handles real-time insertion without page drift
- Slug-based product URLs over IDs
- Dedicated `/api/categories/` endpoint for filter sidebar (DEC-012)
- Static filter values — show all possible, no cascading (DEC-013)
- REST chat endpoints stay alive alongside WebSocket (REST for history, WS for streaming only)
- `send_message_stream` yields uniform `{"event": ..., ...}` dicts (token/stream_start/stream_end) instead of mixing raw strings and dicts — one dispatch shape for every consumer, including 6.3's WebSocket consumer
- Postgres/Redis dev ports moved to 5434/6381 — host port collisions with an unrelated project (avanzo-pg on 5433) and a stale CHANNEL_LAYERS config (6380, nothing listened there)
- `CHANNEL_LAYERS` uses `channels_redis.pubsub.RedisPubSubChannelLayer`, not the default `RedisChannelLayer` — ChatConsumer never uses group_send/group_add, so pub/sub's simpler path is sufficient
- Pinned `redis<5` in `pyproject.toml` — redis-py 8.x raises `TimeoutError` on routine poll timeouts instead of returning `None`, which crashes channels_redis 4.3.0's listener loops (upstream: django/channels_redis#408)
- `ChatConsumer.receive_json` spawns streaming via `asyncio.create_task` (not a direct `await`) so the dispatch loop can pick up the next message while one is in flight — required for the `is_streaming` concurrency guard to be reachable at all, since Channels serializes `receive_json` calls otherwise. All `send_json` calls go through an `asyncio.Lock` since ASGI forbids concurrent `send()` calls on one connection

