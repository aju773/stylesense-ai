# StyleSense AI — Project Context Card

> **Purpose:** Any new agent, chat session, or collaborator reads THIS FIRST.
> Gives full project context in 2 minutes.

---

## What Is This?

An **AI-powered fashion shopping assistant** — a full-stack web app where users chat with an AI stylist to discover, compare, and buy clothing. Built as a portfolio project targeting **40k INR salary** in the Indian job market.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite |
| Styling | Tailwind CSS |
| Server State | TanStack Query v5 |
| Client State | Redux Toolkit |
| Auth/Theme State | React Context API |
| Routing | React Router v6 |
| Backend | Django 5 + Django REST Framework |
| Real-time | Django Channels (WebSocket) |
| Database | PostgreSQL 16 |
| Cache/Broker | Redis |
| AI Primary | Google Gemini API (free tier) |
| AI Fallback | Groq API (free tier) |
| Containers | Docker + Docker Compose |
| Deploy Backend | Render (free tier) |
| Deploy Frontend | Vercel (free tier) |
| Testing Backend | pytest + Factory Boy |
| Testing Frontend | Jest + React Testing Library |

## Core Features

1. **AI Shopping Chatbot** — conversational AI with real-time WebSocket streaming (ChatGPT-like typing effect)
2. **Product Catalog** — browsable fashion products with filters (price, size, color, brand, category)
3. **AI Recommendations** — products suggested inside chat conversations
4. **JWT Authentication** — custom user model, access/refresh tokens, Axios interceptors
5. **Shopping Cart** — Redux-managed with optimistic updates
6. **Wishlist** — manual saves + AI-recommended items (separate tabs)
7. **Order History** — order tracking with status timeline
8. **Chat History** — persistent conversations, resumable
9. **Image Gallery** — multi-image products with zoom

## Design Aesthetic

Minimal, editorial, high-fashion magazine style.
- **Colors:** Black #1A1A1A, White #FFFFFF, Cream #F9F7F4, AI Indigo #6366F1
- **Fonts:** Playfair Display (serif headings) + Inter (sans-serif body)
- **Reference:** POVERIA theme — clean, generous whitespace, sharp button corners

## Build Approach

**Vertical slice / feature-based:** Build backend API + frontend UI for one feature at a time. Connect them. Test. Move to next feature.

## 6-Week Plan Summary

| Week | Focus |
|---|---|
| 1 | Django setup + JWT Auth (backend + frontend) |
| 2 | Product catalog + search/filters |
| 3 | AI integration (Gemini + Groq, REST chat) |
| 4 | WebSocket streaming + real-time chat UI |
| 5 | Cart + Wishlist + Orders |
| 6 | Testing, Docker, Deploy, Documentation |

## Documentation Index

All project documents (save these to Obsidian):

| Document | What it contains |
|---|---|
| **Implementation Plan** | Architecture diagrams, complete file structure, DB schema (ER diagram), feature breakdown with interview Q&A, 6-week day-by-day plan |
| **UI Design Guide** | Design tokens, component hierarchy, page flow diagram, 10 Google Stitch prompts (one per page) |
| **Decision Log** | Every tech decision + WHY it was made + what was rejected |
| **Interview Cheat Sheet** | Feature-by-feature Q&A for interview preparation |
| **Products JSON** | 50 seed products (fashion items with Indian pricing) |
| **This README** | Project context card — read first |

## Key Architecture Patterns

- **Strategy Pattern** — AI provider abstraction (swap Gemini/Groq without code changes)
- **Fallback/Resilience** — primary AI fails, fallback kicks in automatically
- **Adapter Pattern** — product data source abstraction (local DB vs external API)
- **Optimistic Updates** — cart updates UI before server confirms
- **RAG-lite** — AI augmented with real product data from DB, not hallucinating

## Rules for Any Agent Working on This

1. Read **Decision Log** before suggesting architectural changes
2. Follow **UI Design Guide** tokens for any frontend work
3. Follow **Implementation Plan** file structure exactly
4. Build features as vertical slices (backend + frontend together)
5. Write tests for every feature
6. Use Tailwind CSS, not custom CSS
7. Never store JWT in localStorage — memory only
