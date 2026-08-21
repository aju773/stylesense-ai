# 06 — Real-time AI Chat (WebSocket Streaming)

**What to build:** Upgrading the chat to stream responses token-by-token (ChatGPT style) via Django Channels. The frontend features a sleek chat UI with typing indicators.

**Blocked by:** 02 — User Authentication, 05 — AI Chatbot Core

**Status:** ready-for-agent (sliced into sub-tickets)

## Sub-tickets

- [ ] 6.1 — Django Channels + WebSocket Plumbing
- [ ] 6.2 — Streaming Provider + ChatService
- [ ] 6.3 — Wire Streaming into WebSocket Consumer
- [ ] 6.4 — React Chat UI + WebSocket Hook

## Dependency Graph

```
6.1 ──┐
      ├──→ 6.3 ──→ 6.4
6.2 ──┘
```

Parallel starts: 6.1, 6.2

## Key Architectural Decisions (from grilling session)

| Decision | Choice |
|---|---|
| Channel layer | `channels_redis` → existing Redis on `localhost:6380` |
| WebSocket auth | Cookie-based middleware (reads `access_token` from handshake) |
| Streaming provider | New `generate_completion_stream` async generator alongside existing `generate_completion` |
| WS message protocol | `chat.message` (in), `stream_start` / `token` / `stream_end` / `error` (out) |
| ChatService streaming | New `send_message_stream` async generator method |
| Frontend WebSocket | Custom `useChat` hook with native `WebSocket` API |
| WS routing | Single `ws/chat/` endpoint, conversation ID in payload |
| Concurrency | Block — reject messages while streaming, disable send button |
| Rate limiting | Per-user in-consumer check, 5/min |
| ASGI server | `daphne` (replaces `uvicorn`) |
| Chat UI layout | Conversation sidebar + chat window |
| AI response rendering | `react-markdown` in assistant bubbles |
| History loading | REST endpoint + TanStack Query (WS for streaming only) |
| Token expiry | Auth at handshake only, close socket on logout |
