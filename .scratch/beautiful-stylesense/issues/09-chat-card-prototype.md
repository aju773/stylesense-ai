# 09 — AI chat product cards: breakout layout

Type: prototype
Status: resolved
Blocked by: 04, 05

## Question

What do the AI's product recommendations look like once they escape the chat
bubble?

Today `ChatBubble.tsx` renders `ChatProductStrip` inside a bubble capped at
`max-w-[70%]`, and each card is `w-[160px]` in a horizontally scrolling row.

Build a rough prototype, then decide:

- **Container.** Whether the cards break the bubble's width constraint, span the
  full conversation column, or move outside the bubble entirely as a distinct
  block attributed to the assistant message.
- **Layout.** Horizontal scroll strip versus a wrapping grid, and how each
  behaves at one, three, and eight recommendations.
- **Card size and content.** What earns space at the new size: the image is the
  point, but brand, name, price, discount, rating, and stock all compete.
  `ProductCard` in the catalog grid is the obvious reference — decide whether the
  chat card converges on it or stays deliberately distinct.
- **Where the rationale sits** on the card, and how much of it — one line, or
  expandable.
- **Add to Bag placement**, and its relationship to the existing save-heart,
  which is already positioned absolutely at `top-2 right-2`.
- **Streaming behaviour.** Cards arrive as a `products` WebSocket event after
  the text finishes streaming. Decide what occupies that space while the text
  streams, and whether cards animate in.
- **Mobile.** The conversation column is narrow; decide the card treatment
  there.

## Prototype

Captured on branch **`prototype/beautiful-stylesense`** (commit `3680b78`), off `main`. The files below do not exist on `main` — check the branch out to run them.

`frontend/src/pages/prototype/ChatCardsPrototype.tsx`, routed at
`/prototype/chat-cards?v=a|b|c|d`. Throwaway — delete with its route in
`App.tsx`.

Reproduces the real chat column (sidebar + `flex-1` message list, assistant
bubble capped at `max-w-[70%]` exactly as `ChatBubble` does today) and renders
the current 160px-in-a-bubble version directly above the proposal for contrast.
Controls: pick count 1/3/8, full vs mobile width, streaming skeletons on/off,
and show/hide the current rendering.

| Variant | Image | Rationale | 8 picks | Mobile |
| --- | --- | --- | --- | --- |
| today | 160px | none | scroll | cramped |
| A full-bleed strip | 200px | clamped to 2 lines | 5 hidden | scroll |
| B wrapping grid | ~190px | clamped | wraps tall | 1-up |
| C detached block | ~210px | **full** | wraps tall | 1-up |
| D editorial rows | 104px | **full** | 8 long rows | best |

## Answer

### 1. Variant C — the picks leave the bubble and become their own block

The prose stays in the assistant bubble. The recommendations become a separate
block below it, attributed to the assistant by an indigo left rail, headed
`N picks for you`.

Rationale is what separated the variants. In A and B the `✦` line has to clamp
to two lines or the cards go ragged — *"The relaxed shoulder works with the
wide-leg trousers you saved…"* truncates mid-thought. C gives it a full line
while keeping the photograph at ~210px against today's 160px. Since the whole
point of adding a rationale is that the shopper reads it, a layout that truncates
it is fighting the decision.

The block header also solves the single-pick case: one lonely card in a wide
column reads like a rendering bug, whereas `1 pick for you` reads deliberate.

Accepted cost: **a message is no longer one bubble.** The turn is now prose plus
an attributed block, which touches how REST history rebuilds a conversation.

### 2. Streaming — skeletons sized by counting markers

The `products` WebSocket event arrives *after* the text finishes streaming, so
the naive options are an empty gap then a pop-in, or a guessed skeleton count
that is usually wrong.

Neither is necessary. The `[[product:12]]` markers stream **inline with the
text**, and `ChatBubble.tsx:11` already parses them out with `MARKER_RE` before
render. The browser therefore knows how many products are coming, and in what
order, well before the event lands — it is already extracting that information
and throwing it away.

So: count markers during the stream, render exactly that many skeletons, fill
them when the event arrives. The block reserves its true height and never jumps.

**Degrade path:** if marker-counting proves unreliable on either provider, fall
back to a fixed skeleton count rather than to an empty gap.

### 3. Mobile — the block renders as editorial rows

At 375px a ~210px grid does not fit. The block collapses to variant D's layout:
small 4:5 image left, brand / name / rationale / price / action right.

Chosen because it is the only narrow layout that keeps the rationale on a full
line — the exact property C was picked for. Full-width tall cards are more
beautiful and much worse to scroll past: three picks push the chat input far
off-screen, which fights the medium. A horizontal strip reintroduces the
hidden-items problem on the viewport least able to afford it.

### 4. One card component with optional slots

`ProductCard` and `ChatProductStrip`'s mini card are separate files duplicating
image, brand, name, price, discount strike-through, and save heart. Ticket 04
already deleted a duplication between them (`getGradient` existed in both).

After tickets 04 and 06 they converged further without anyone intending it: both
are now 4:5, and the sizes are close — catalog ~290px, chat block ~210px. What
genuinely differs is that the chat card carries a **rationale** and an **Add to
Bag**. That is two optional slots, not two components.

Rejected: giving the catalog grid Add to Bag as well. It reopens the size and
colour problem across 50 cards for a capability nobody asked for.

### Finding — Add to Bag cannot be a single button

`CartItem` is unique on `(cart, product, size, color)`, and `ProductDetail`
makes the shopper choose both before adding. In the prototype the button expands
the card into a size picker, and for a product with more than one colour it
needs a colour too.

So "Add to Bag" on a chat card is really "open a picker", and the layout must
reserve room for it. The prototype demonstrates the footprint. **How** that
picker behaves — inline expand, popover, or route to the product page — is
ticket 10's decision, not this one.

### Finding — the block can never exceed five cards

`ContextBuilder(top_k=5)` puts at most five products in context, and
`SYSTEM_PROMPT` instructs the model to cite each product at most once per reply.
The prototype's 8-pick stress case is beyond what the backend can currently
produce, so no display cap is required. If `top_k` is ever raised, revisit.
