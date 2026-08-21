# StyleSense AI — Interview Cheat Sheet

> Quick-study reference. Each section = one feature area.
> Format: **Q** (what interviewer asks) → **A** (your answer that shows depth)

---

## Authentication & Security

**Q: Why custom user model?**
A: Django default uses username. Real apps use email. Extended `AbstractBaseUser` for full control over fields and auth behavior.

**Q: How password stored?**
A: Django uses PBKDF2 with SHA256 by default. Never store plain text. Salt is auto-generated per user.

**Q: Why two JWT tokens (access + refresh)?**
A: Access token short-lived (5 min) — limits damage if stolen. Refresh token longer (7 days) — avoids forcing re-login. Separation of concerns: access for authorization, refresh for session continuity.

**Q: What if access token expires mid-request?**
A: Axios interceptor catches 401, uses refresh token to silently get new access token, retries original request. User never sees interruption. If refresh also expired, redirect to login.

**Q: Where you store JWT on frontend?**
A: In memory (React state/context), NOT localStorage. localStorage vulnerable to XSS — any injected script can read it. Memory clears on tab close = safer. Trade-off: user must re-auth on refresh, but refresh token in httpOnly cookie handles that.

**Q: XSS vs CSRF — how you handle both?**
A: XSS: sanitize all user input, use React's built-in escaping (JSX auto-escapes), Content-Security-Policy headers. CSRF: Django's built-in CSRF middleware for session-based views; JWT endpoints are stateless so CSRF less relevant, but I set SameSite cookie attribute for refresh token.

---

## Product Catalog & Search

**Q: Why JSON field for sizes/colors instead of separate tables?**
A: Fashion products have variable attributes. JSON field more flexible — no need for join tables. PostgreSQL indexes JSON natively with GIN indexes. Trade-off: can't enforce referential integrity on individual values, but for product attributes that's acceptable.

**Q: Explain N+1 query problem. How you solved it?**
A: If I fetch 50 products and each has images, naive ORM does 1 query for products + 50 queries for images = 51 queries. Fixed with `prefetch_related('images')` — 2 queries total. Used `select_related` for ForeignKey (category) and `prefetch_related` for reverse FK/M2M (images).

**Q: Why cursor pagination, not offset?**
A: Offset pagination: `OFFSET 10000` means DB scans and discards 10000 rows. Slow at scale. Cursor pagination uses indexed `WHERE id > last_seen_id LIMIT 20` — constant time regardless of page number.

**Q: How filtering works?**
A: django-filter library. Custom `FilterSet` class defines filters per field. Price range = `RangeFilter`, colors = `MultipleChoiceFilter`, size = custom filter checking JSON field contains value. All composable — user can combine any filters.

---

## AI Chatbot

**Q: How fallback between Gemini and Groq works?**
A: Strategy pattern. Abstract base class `AIProvider` defines `generate()` interface. `GeminiProvider` and `GroqProvider` implement it. `FallbackOrchestrator` tries primary (Gemini), catches specific exceptions (rate limit, timeout, API error), falls back to Groq. Open/Closed principle — add new provider without changing existing code.

**Q: How AI knows about your products?**
A: Context builder queries relevant products from PostgreSQL based on user message keywords/intent, injects into system prompt as structured context. AI sees product catalog as context, not training data. This is a RAG-lite pattern — Retrieval Augmented Generation without vector DB.

**Q: Why WebSocket not REST for chat?**
A: REST = request-response. User waits for full AI response (could be 3-5 seconds). WebSocket = stream tokens as they generate. First token appears in ~200ms. 3x better perceived performance. Same pattern as ChatGPT's typing effect.

**Q: How WebSocket auth works? Different from HTTP?**
A: HTTP sends JWT in Authorization header per request. WebSocket handshake is HTTP, but after upgrade, no more headers. So I authenticate during WebSocket handshake (connect phase) — extract token from query param or cookie, validate, attach user to scope. If invalid, reject connection.

**Q: How conversation context maintained?**
A: Last N messages (e.g., 10) from `ChatMessage` table sent with each AI request as conversation history. Conversation model groups messages by session. User can resume past conversations — full context reloaded from DB.

**Q: What if AI gives wrong product recommendation?**
A: AI is augmented with real DB data, not hallucinating products. System prompt instructs: "Only recommend products from the provided catalog. If no match, say so." Product references in AI response are validated against DB before displaying.

---

## State Management

**Q: Why three different state tools (TanStack Query + Redux + Context)?**
A: Different problems need different solutions. Server state (products, chat history) needs caching, background refetch, stale handling — TanStack Query built for this. Client state (cart contents, UI toggles) needs synchronous local updates — Redux. Simple cross-cutting state (current user, theme) — Context avoids Redux boilerplate for trivial cases.

**Q: What is stale-while-revalidate?**
A: Show cached data immediately (fast UX), then fetch fresh data in background. If fresh data differs, update UI. User sees instant response, data stays fresh. TanStack Query's `staleTime` controls how long before cached data considered stale.

**Q: What are optimistic updates?**
A: Update UI immediately before server confirms. Example: user adds to cart → cart count increments instantly → API call fires in background. If API fails, rollback state and show error toast. Better UX than showing spinner for every action.

**Q: When is Redux overkill?**
A: When state is only used by one component and its children — local state (`useState`) sufficient. When state is server data with caching needs — TanStack Query better. Redux shines for: shared client state across unrelated components, complex state transitions, time-travel debugging needs.

---

## Cart, Wishlist, Orders

**Q: How you handle race conditions in stock?**
A: Django `select_for_update()` locks product row during stock check. Wrapped in `transaction.atomic()` — stock decrement and order creation succeed together or rollback together. Prevents two users buying last item simultaneously.

**Q: What if user double-clicks "Place Order"?**
A: Idempotency key. Frontend generates unique key per order attempt, sends with request. Backend checks: if key exists in recent orders, return existing order instead of creating duplicate. Also: disable button after first click on frontend.

**Q: How wishlist connects to AI?**
A: When AI recommends product in chat, response includes product IDs. "Add to Wishlist" button in chat message saves that product reference. Wishlist page has "AI Picks" tab showing items saved from AI conversations vs manually saved.

---

## Testing

**Q: What do you test?**
A: Backend: every API endpoint — valid input, invalid input, unauthorized access, edge cases (empty cart checkout, out-of-stock product). Frontend: component behavior — "does clicking Add to Cart update count?" not "does state.items.length equal 1?" Integration: WebSocket consumer with Django Channels test utilities.

**Q: Why React Testing Library over Enzyme?**
A: RTL tests behavior from user perspective (click button, see result). Enzyme tests implementation details (check state, check props). When I refactor internal state, RTL tests still pass because behavior unchanged. Enzyme tests break on every refactor.

---

## Docker & Deployment

**Q: Why multi-stage Dockerfile?**
A: First stage: install dependencies, build assets. Second stage: copy only production artifacts into slim base image. Result: 60% smaller image. Faster deploys, smaller attack surface, no dev dependencies in production.

**Q: What's in your docker-compose?**
A: 4 services: Django (Daphne ASGI server for WebSocket support), React (served by Nginx), PostgreSQL, Redis (channel layer for Django Channels). One `docker-compose up` starts everything. Environment variables in `.env` file.

**Q: How you manage secrets?**
A: `.env` file for local development (gitignored). Environment variables in Render/Vercel dashboards for production. `.env.example` committed — shows required variables without values. Never commit actual secrets.

---

## Meta / Design Decision Questions

**Q: Why React, not Next.js?**
A: This is a SPA with Django backend handling all API logic. Next.js adds SSR/SSG which adds complexity without benefit here — SEO not critical for an app behind login. React + Vite gives fastest dev experience for SPA.

**Q: Why Django, not Node.js/Express?**
A: Django's ORM, admin panel, migration system, and built-in auth save weeks of setup. DRF (Django REST Framework) is battle-tested for APIs. Django Channels adds WebSocket without switching framework. Python also better for AI/ML integration.

**Q: What would you do differently with more time?**
A: Vector database (Pinecone/ChromaDB) for true semantic product search. Payment integration (Razorpay). Email notifications. Admin dashboard for product management. CI/CD pipeline with GitHub Actions. Rate limiting on AI endpoints.

**Q: What was hardest part?**
A: WebSocket auth + streaming. HTTP auth is stateless per-request. WebSocket is persistent connection — auth happens once at handshake, then trust the connection. Had to deeply understand ASGI lifecycle and Django Channels authentication middleware.
