# StyleSense AI — Decision Log

> Every technical decision made during project planning, with rationale.
> Reference this before changing any architectural choice.

---

## Project Identity

| Field | Value |
|---|---|
| Project Name | StyleSense AI |
| Type | AI-powered fashion shopping assistant |
| Domain | Fashion / Clothing e-commerce |
| Target User | Fashion shoppers who want AI-guided recommendations |
| Portfolio Target | 40k INR salary (India market) |
| Timeline | 6+ weeks, learning pace (2-3 hours/day) |
| Developer Skill Level | Knows basics of React, Django, Docker — building depth |

---

## Decisions

### 1. Core Feature Scope

| | |
|---|---|
| **Decided** | Personal shopping chatbot as core, with recommendation, search, and comparison as conversation capabilities inside it |
| **Why** | One deep feature > four shallow ones. Chatbot naturally encompasses all four. Shows real-time UI, API design, AI integration, state management — maximum interview surface area in one feature. |
| **Rejected** | 4 separate feature pages from day one — too broad, leads to shallow implementation |

### 2. Product Domain

| | |
|---|---|
| **Decided** | Fashion / Clothing |
| **Why** | Visual-heavy = impressive portfolio UI. Rich attributes (size, color, brand, style) showcase AI filtering and DB modeling. |
| **Rejected** | Electronics (less visual), General e-commerce (too broad, shallow data model), Groceries (boring UI) |

### 3. Data Source Strategy

| | |
|---|---|
| **Decided** | Mix — seed data for demo + adapter pattern for real API extensibility |
| **Why** | 50+ realistic products ensure demo always works. Adapter pattern (abstract base class) shows interviewer "I designed for extensibility." |
| **Rejected** | Scraping (legal risk, fragile), API-only (demo breaks if API down), Seed-only (no extensibility story) |

### 4. Authentication

| | |
|---|---|
| **Decided** | JWT auth built from scratch (Django REST + React) |
| **Why** | JWT most asked in interviews for this salary range. Building from scratch = deep understanding of token flow, refresh logic, middleware, protected routes. |
| **Rejected** | Session auth (less impressive), Social login only (skips understanding auth internals), No auth (red flag in interview) |

### 5. AI Providers

| | |
|---|---|
| **Decided** | Gemini API (primary) + Groq API (fallback) |
| **Why** | Fallback pattern shows resilience thinking. Gemini generous free tier. Groq fast inference as backup. Interviewer sees "I handle API failures gracefully." |
| **Rejected** | Single provider (no resilience story), HuggingFace (slower, less consistent) |

### 6. API Communication

| | |
|---|---|
| **Decided** | REST + WebSocket (Django Channels) |
| **Why** | WebSocket enables real-time token streaming (ChatGPT-like typing effect). 3x better perceived performance. Shows understanding of both paradigms. |
| **Rejected** | REST-only (no streaming, user waits for full response), WebSocket-only (overkill for non-chat endpoints) |

### 7. Database

| | |
|---|---|
| **Decided** | PostgreSQL |
| **Why** | Production-grade. Expected knowledge for 40k INR role. Native JSON field support for flexible product attributes. |
| **Rejected** | SQLite (fine for dev but "why not Postgres?" unanswerable in interview) |

### 8. Frontend State Management

| | |
|---|---|
| **Decided** | Three-layer approach: TanStack Query (server state) + Redux Toolkit (client state) + Context API (auth/theme) |
| **Why** | Shows understanding that server state and client state are fundamentally different. TanStack Query handles caching/refetching. Redux for synchronous local state (cart). Context for simple cross-cutting concerns. THE senior-level answer. |
| **Rejected** | Redux for everything (over-engineering server state), Context for everything (doesn't scale), Zustand (less interview demand in India market) |

### 9. Styling

| | |
|---|---|
| **Decided** | Tailwind CSS |
| **Why** | Huge demand in Indian job market. Fast to build good-looking UI. Portfolio needs premium visual impact. |
| **Rejected** | CSS Modules (slower dev), MUI ("just used library components" criticism), Styled Components (less market demand) |

### 10. Deployment Strategy

| | |
|---|---|
| **Decided** | Docker + Render (Django) + Vercel (React) |
| **Why** | Docker shows DevOps awareness. Live URL in resume = instant credibility. Free tiers sufficient. docker-compose shows service orchestration. |
| **Rejected** | Local-only (no live demo link, weaker resume), Deploy without Docker (misses DevOps skill demonstration) |

### 11. Testing

| | |
|---|---|
| **Decided** | Both backend (Django unit tests + pytest) and frontend (Jest + React Testing Library) |
| **Why** | "Do you write tests?" = guaranteed interview question. Even 60-70% coverage shows habit. Skipping tests = "I'm junior" signal. |
| **Rejected** | No tests (junior signal), Backend-only tests (misses frontend testing skill) |

### 12. Design Aesthetic

| | |
|---|---|
| **Decided** | Minimal, editorial, high-fashion magazine style. Black/white/cream palette. |
| **Reference** | POVERIA theme screenshot |
| **Fonts** | Playfair Display (serif headings) + Inter (sans-serif body) |
| **Key colors** | Primary #1A1A1A, Background #FFFFFF, Cream #F9F7F4, AI Accent #6366F1 |
| **Why** | Fashion domain demands premium visual. Editorial style = fewer elements, more impact. Cream warmth prevents sterile feel. |

### 13. Build Approach

| | |
|---|---|
| **Decided** | Simultaneous / vertical slice (backend + frontend per feature) |
| **Why** | See complete data flow DB → API → State → UI per feature. Immediate feedback. No mock data needed. Real-world approach. |
| **Rejected** | Full backend first then frontend (delayed feedback), Full UI first then backend (needs mock data, disconnected learning) |

---

## Additional Features (Beyond Core Chatbot)

Selected during grilling:
1. ✅ Chat history persistence
2. ✅ Wishlist (with AI-recommended items)
3. ✅ Product image gallery with zoom
4. ✅ Search with filters (price, category, size, color)
5. ✅ Shopping cart with quantity management
6. ✅ Order history page

Not selected:
- ❌ Dark/Light mode toggle (nice-to-have, add if time)
- ❌ User profile with preferences (partially included in auth)

---

## DEC-012: Dedicated Categories Endpoint

- **Date:** 2026-08-01
- **Context:** Filter sidebar needs a category list for checkboxes
- **Decision:** Add a dedicated `/api/categories/` list endpoint
- **Why:** Clean separation — sidebar fetches categories independently of paginated product list. Client-side derivation would only show categories of already-loaded products, missing categories with zero loaded results.

## DEC-013: Static Filter Values (All Possible)

- **Date:** 2026-08-01
- **Context:** Should size/color filter options reflect all DB values or only the current filtered result set?
- **Decision:** Show all possible values from the database (no cascading filters)
- **Why:** Simpler for V1. User sees full picture. No confusing disappearing options. Cascading filters (only showing values in current result set) would require an aggregation endpoint — can revisit later if UX demands it.

---

> [!IMPORTANT]
> **Rule: Do not change any decision above without updating this log.** If a future agent or session suggests a different approach, check here first for the original reasoning. Change only if new information invalidates the "Why."
