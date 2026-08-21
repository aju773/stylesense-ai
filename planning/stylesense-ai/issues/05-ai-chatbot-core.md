# 05 — AI Chatbot Core (Context Injection & Strategy Pattern)

**What to build:** A working AI service layer (Gemini primary, Groq fallback). The AI can answer styling questions with context injected from our product database via vector search (pgvector + Gemini embeddings), served through REST endpoints.

**Blocked by:** 03 — Product Catalog Base & Seed Data

**Status:** done

## Sub-tickets

- [x] 5.1 — pgvector Docker + Product Embeddings
- [x] 5.2 — AI Provider Interface + Gemini Provider
- [x] 5.3 — Groq Fallback Provider + Orchestrator
- [x] 5.4 — Conversation + ChatMessage Models
- [x] 5.5 — Context Builder (Vector Search)
- [x] 5.6 — System Prompt + Chat Service
- [x] 5.7 — REST Chat Endpoints + Throttling

## Dependency Graph

```
5.2 ──→ 5.3 ──┐
               ├──→ 5.6 ──→ 5.7
5.1 ──→ 5.5 ──┘
               │
5.4 ───────────┘
```

Parallel starts: 5.1, 5.2, 5.4

## Key Architectural Decisions (from grilling session)

| Decision | Choice |
|---|---|
| Service layer location | `apps/chat/services/` (HackSoft pattern) |
| Sync vs async | Async from day one |
| Provider interface format | OpenAI message list as common interface |
| Context builder strategy | Vector search — pgvector + Gemini `text-embedding-004` |
| Chat persistence | Conversation + ChatMessage models from the start |
| REST API shape | Nested resources (`/api/chat/conversations/`, `.../messages/`) |
| History window | Last 20 messages per conversation |
| Rate limiting | Per-user DRF throttling (5/min, 100/day) |
| AI models | Primary: `gemini-2.5-flash`, Fallback: `llama-3.3-70b-versatile` |
| AI behavior | Hybrid — catalog products + general fashion advice |
