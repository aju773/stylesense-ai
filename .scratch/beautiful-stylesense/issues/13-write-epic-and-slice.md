# 13 — Write the Epic 11 doc and slice sub-tickets

Type: task
Status: resolved
Blocked by: 01, 02, 03, 04, 05, 06, 07, 08, 09, 10, 11, 12

## Question

Turn every resolved decision on this map into the spec that is this effort's
destination.

Do the work:

- Write `planning/stylesense-ai/issues/11-<slug>.md` as the epic doc, matching
  the structure of the existing epics `01`–`10`. It carries the reasoning: why
  these six surfaces, why the filter rail was abandoned, why imagery and fonts
  came first, and what was ruled out of scope and why.
- Slice numbered sub-tickets `11.1` through `11.N`, matching the convention and
  granularity of the existing sub-tickets — each one a single session's work,
  each with enough detail to be implemented without reading this map.
- Order the sub-tickets so the foundation and imagery land before any surface
  work, since every surface depends on both.
- Carry every decision from this map's Decisions-so-far into the tickets, with
  the map's ticket as the reference for anything a reader needs the reasoning
  behind.
- Move the fog items from the map's **Not yet specified** section into the epic
  doc as open questions, or graduate them into sub-tickets if the resolved
  decisions have made them specifiable.
- Update `progress.md` with the new epic, per the project's workflow rule.

## Answer

Done. The spec is `planning/stylesense-ai/issues/11-beautiful-stylesense.md` plus
eleven sub-tickets, matching the structure of epics 01–10.

### Epic doc

`11-beautiful-stylesense.md` carries the reasoning the sub-tickets cannot hold:

- **Why these six surfaces** — including the two problems found underneath the
  brief that mattered more than any of the three surfaces named in it: Playfair
  Display never loading, and a catalog with no photographs whose list serializer
  could not have sent one anyway.
- **Decisions** — the cross-cutting ones: the deliberate deviation from the shop
  design's left rail; one photo per product with derived crops; the rule that
  nothing claims a feature that does not exist, including the distinction that
  saved "Trending Now"; preferences steering but only gender filtering; no new
  backend models; and the `backdrop-filter` containing-block trap.
- **Open questions** — the six fog patches, moved here verbatim rather than lost.
- **Out of scope** — the six rulings, each with the reason it was ruled out.

### Sub-tickets

Ordered so the foundation and imagery land before any surface work, since every
surface depends on both.

| Ticket | Blocked by |
| --- | --- |
| 11.1 Typography, Design Tokens, and Document Head | — |
| 11.2 Site Chrome: Two-Row Header and Footer | 11.1 |
| 11.3 Product Imagery: Curation and Seeding | — |
| 11.4 Image Rendering: Serializer, Ratios, and Fallback | 11.3 |
| 11.5 Faceted Search API | 11.4 |
| 11.6 Shop Filter Bar | 11.2, 11.5 |
| 11.7 Home Page | 11.2, 11.4 |
| 11.8 Style Profile: Schema, API, and Prompt Injection | — |
| 11.9 Profile Page | 11.1, 11.8 |
| 11.10 Chat Rationale Contract | 11.8 |
| 11.11 Chat Picks Block and Unified Product Card | 11.4, 11.10 |

11.1, 11.3 and 11.8 are unblocked and can run in parallel.

Each sub-ticket carries its own `## Decisions` section in the house style —
bold-led paragraphs stating the decision and the reason, including the option
that lost — so it can be implemented without reading this map. Each of the three
prototype-informed tickets (11.6, 11.9, 11.11) names its prototype file and
carries deleting it as a checklist item.

### Fog

All six patches moved into the epic's **Open questions** section rather than
graduating into sub-tickets. None became specifiable: motion language needs
11.1's tokens to exist, the loading/empty/error question needs the surfaces
built, accessibility needs the final chrome, hero LCP wants measurement rather
than a guess, OG tags need the hero image chosen, and a personalised home page
needs profiles that are actually populated.

### `progress.md`

`## Current` rewritten to say the epic is a spec with nothing built, pointing at
11.1 and 11.3 as the starting points and noting the three prototypes awaiting
deletion. Twenty-six epic-11 decisions appended under `## Recent Decisions` in
the file's existing style.

### Left undone, deliberately

The three prototypes and their routes in `App.tsx`, plus `.claude/launch.json`,
are **uncommitted** in the working tree. The `/prototype` skill asks for them to
be captured on a throwaway branch with a pointer from the issue; that needs the
developer's go-ahead, so it has not been done.
