# 06 — Shop filter bar: interaction model

Type: prototype
Status: resolved
Blocked by: 04, 05

## Question

What does the top filter bar look like and how does it behave?

Build a rough, throwaway prototype to react to, then decide:

- **Facet presentation.** Each facet as a dropdown popover, an inline expanding
  row, or a mix. There are six facets today — Category, Gender, Price, Size,
  Colour, plus Brand, which the API supports but the UI never exposed.
- **Apply model.** Filters apply instantly on click, or accumulate behind an
  Apply button as `designs/page-shop` draws. Instant application interacts with
  the 400ms debounce already in `Products.tsx`; an Apply button changes what the
  URL contains and when.
- **Selected-state display.** An active-filter chip row already exists below the
  bar. Decide whether it survives, and how a multi-select facet summarises
  itself on its own control ("Colour: 2" versus listing values).
- **Counts.** Where the number sits per option, and what an option with zero
  results looks like — disabled, hidden, or shown with a zero.
- **Sort control.** Placement relative to the facets and to the result count,
  and whether it reads as a filter or as a separate concern.
- **Bar behaviour on scroll.** Sticky, or scrolls away with the page.
- **Grid density.** The grid is `grid-cols-2 md:grid-cols-3` inside a
  flex row today. With the rail gone there is room for four columns; decide the
  new breakpoint ladder and whether a density toggle (the two icons in
  `designs/page-shop`) is worth shipping.

The output of this ticket constrains the API contract in ticket 07 — the
interaction decides what the endpoint must return, not the reverse.

## Prototype

Captured on branch **`prototype/beautiful-stylesense`** (commit `3680b78`), off `main`. The files below do not exist on `main` — check the branch out to run them.

`frontend/src/pages/prototype/FilterBarPrototype.tsx`, routed at
`/prototype/filter-bar?v=a|b|c|d`. Throwaway — delete with its route in
`App.tsx` once this is implemented.

Four variants on one route, switchable from a floating bottom bar that also
exposes live column count, sticky on/off, and a raw state dump. 34 mock
products with real 4:5 Unsplash photos through the imgix pipeline from ticket
04, and Playfair + Inter loaded so type could be judged honestly. Counts
recompute against every *other* active facet — selecting Women drops Category
from `Jeans 5` to `Jeans 2` while Gender's own counts hold at 12/11/11, which is
the correct within-facet-OR / across-facet-AND semantic, confirmed working.

Measured at a 1440 viewport:

| Variant | Vertical cost | Counts visible | Facets held |
| --- | --- | --- | --- |
| A popover bar | 56px | on open | 6 |
| B expanding panel | 56px → 166px on open | on open | 6 |
| C flat pill rows | 230px, permanent | always | **5 — no price** |
| D filter sheet | 62px | only inside the sheet | 6 |

## Answer

### 1. Variant A — popover bar, instant apply

Facet buttons in a single 56px row; each opens a dropdown of checkboxes with
counts; selections apply immediately.

It was the only variant that shows counts, holds all six facets, and stays at
56px. C pushes the grid almost entirely below the fold and **cannot express
price at all** — a range needs a slider and a slider does not fit a pill row, so
C silently ships five facets. B costs the most code of the four: it needs a full
draft copy of the filter state plus reconciliation on Apply. D gives the grid the
most room but hides every count behind a click, which undoes the reason ticket 05
wanted counts.

### 2. The chip row stays

Both signals ship: a badge on the facet button (`COLOUR ②`) and a chip row naming
the selected values (`Black ✕` `Navy ✕`).

They look redundant and aren't. The badge says *how many*, never *which* — with
multi-select that is the difference between "Colour ②" and "Black, Navy". The
deciding case is price: a range has nothing to badge, so **price only ever
appears as a chip**. Cut the row and an active price filter becomes invisible
unless the shopper reopens the popover.

### 3. Zero-count options stay visible, greyed and disabled

Rendered with a literal `0`, not hidden.

Hiding them makes the popover's length change every time another facet is
touched — the list reflows under the cursor mid-interaction. And a `0` carries
information: "Levi's 0" says Levi's makes no dresses; a missing row says nothing.
Disabled rather than clickable, because an option that leads to an empty grid is
a small betrayal.

### 4. Sticky — the header yields the slot on `/shop`

Ticket 05 left the nav row permanently sticky. Stacking a sticky filter bar under
it would put ~100px of chrome on every scroll of the page built for looking at
photographs.

Instead, on `/shop` the **whole header retracts** on scroll and the filter bar
takes the sticky slot. Net sticky cost stays 56px — no worse than today — and the
control that survives is the useful one. Nobody deep in a filtered catalog needs
a link to Home. Mechanically this is the same scroll listener ticket 05 already
committed to, retracting one more row on one route.

### 5. Grid density — 2 / 3 / 4, no toggle

A fixed responsive ladder: 2 columns on mobile, 3 on tablet, 4 on desktop.

Measured card widths at 1440: 3-up gives ~400px, 4-up ~290px, 5-up ~225px. 3-up
is the more editorial composition, but 50 products becomes 17 rows of scrolling
and shoppers lose the ability to compare across a row. 4-up at ~290px is still a
real photograph rather than a thumbnail.

The density toggle drawn in `designs/page-shop` is dropped: it is persisted
preference state spent on a control almost nobody touches.

### 6. Mobile — the filter sheet, portalled

One `Filters (n)` button opens a full-height sheet holding all six facets, with
sort inline in the bar. This is variant D, and its desktop objection — counts
hidden behind a click — evaporates on mobile, where six popovers cannot fit
375px regardless.

Not greenfield: sub-ticket 4.4 already built a 300px right-hand drawer rendering
`FilterSidebar`. This is that drawer upgraded with multi-select, counts, and
price.

**This clears the map's "mobile behaviour of the top filter bar" fog patch.**

### Finding — `backdrop-blur` traps `position: fixed`

Variant D's sheet first rendered clipped inside the sticky bar. An ancestor with
`backdrop-filter` creates a containing block, so `position: fixed` resolves
against *it* rather than the viewport. Fixed in the prototype with
`createPortal` to `document.body`.

This is not a prototype quirk. `SiteHeader` already uses
`bg-white/90 backdrop-blur-md`, ticket 05 keeps it, and this filter bar adds
another. Any fixed overlay rendered inside either — the cart drawer, the mobile
filter sheet, a future modal — will hit this. Recorded on the map as a standing
finding.
