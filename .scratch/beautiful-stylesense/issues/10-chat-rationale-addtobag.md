# 10 — Chat cards: rationale contract and Add to Bag

Type: grilling
Status: resolved
Blocked by: 09

## Question

How does a per-card rationale reach the frontend, and how does Add to Bag work
from a chat card?

**Rationale.** The AI cites products with `[[product:12]]` markers, parsed by
`backend/apps/chat/product_markers.py` and stripped in the browser by
`ChatBubble.tsx` before render. Attaching a reason to each pick means changing
that contract. Decide:

- Whether the marker itself carries the reason (`[[product:12|reason text]]`),
  whether the reason is emitted separately in a structured block, or whether the
  backend derives it from the surrounding prose.
- What `SYSTEM_PROMPT` must instruct, and whether both providers — Gemini and
  the Groq fallback — can be relied on to comply. Marker compliance was verified
  on both in sub-ticket 7.1; a richer format needs the same treatment.
- What happens when the model **omits** the reason, emits a malformed one, or
  writes one that is too long for the card.
- How the reason is **persisted**. `ChatMessage.products` is a plain many-to-many;
  a per-pick reason is data about the relationship, not about either side.
- Whether historical messages, which have no reasons, degrade gracefully.

**Add to Bag.** `CartItem` is unique on `(cart, product, size, color)` and
`ProductDetail` makes the shopper choose both before adding. Decide:

- Whether the chat card can add to the bag at all without a size and colour, and
  if not, what the card does instead — expand inline, open a small picker, or
  route to the product page.
- What feedback the shopper gets. The cart drawer already opens on add elsewhere;
  decide whether it opening over a conversation is right.
- What an out-of-stock recommendation does, given the AI can recommend products
  whose stock has since gone.

## Answer

Five decisions. One question was settled by the code before grilling began.

### 0. The picker is compulsory, not a preference

`cart_service._validate_variant` rejects a bag line whenever the product has
sizes or colours and the request omits them:

```python
if product.sizes and size not in product.sizes:
    raise InvalidVariant(...)
if product.colors and color not in product.colors:
    raise InvalidVariant(...)
```

`CartItem.size` and `.color` are `blank=True, default=""`, so a bare line is
valid at the *model* level — but every product in the catalog has both
populated. A one-click add from a chat card returns `InvalidVariant`, always.
The only open question was the picker's shape.

### 1. Rationale contract — `[[why:<id>]]` lines appended after the prose

The existing `[[product:12]]` marker is **untouched**. The model appends
`[[why:12]] <one sentence>` lines after its prose. `MARKER_RE` and
`extract_product_ids` keep working unchanged.

Why not extend the marker to `[[product:12|reason]]`: `MARKER_RE` only matches
complete markers, so during streaming the reader sees
`[[product:12|The relaxed shoul…` as literal text until `]]` arrives. Today that
window is three characters; with a sentence inside it, it is a long visible
flicker in the middle of the prose. The line-based form streams cleanly, and the
frontend hides **everything from the first `[[why:` onward** while streaming —
one rule, no flicker.

Why not derive the reason from the surrounding prose: ticket 09 puts the prose in
the bubble and the cards directly beneath it. A card whose "why" is a sentence
lifted from the bubble above makes the reader read the same words twice, inches
apart.

**The decisive property:** `ChatMessage.content` already persists markers intact
— deliberately, so history can rebuild card ordering. So reasons **reparse from
stored content** on history load. No through-model, no new field, no migration.
Extending the marker instead would need somewhere to hang per-relationship data
on a plain M2M, which means a through-model, against this map's standing rule.

The contract is additive: a model that ignores it produces exactly today's
behaviour.

### 2. Non-compliance degrades silently

Three failure modes — a pick with no `[[why:]]` line, a malformed line, and a
reason too long for the card. All handled by dropping or clamping. The prompt
caps reasons at one sentence, roughly 120 characters; render clamps.

This matches the posture the marker contract already established, documented in
`_attach_cited_products`: *"Ids come from a prompt-level contract the model can
break, so they are validated against the database here — unknown ids are dropped
silently."*

A card without a why-line is still a good card. This is an enhancement, not a
dependency.

Rejected: all-or-nothing suppression, where one dropped line deletes the
rationale from all five cards — a failure amplifier whose inconsistency would
read as a bug. Rejected: retrying the call, which doubles latency and cost on a
streaming interface to recover an enhancement.

**Verification required:** sub-ticket 7.1 verified marker compliance on both
Gemini and the Groq fallback. This richer contract needs the same pass, and Groq
is the weaker of the two — the likeliest to drop reasons under load.

### 3. The picker expands the card in place

Clicking Add to Bag expands the card into a size grid, plus a colour row when the
product has more than one colour. Demonstrated in ticket 09's prototype.

Accepted cost: ticket 09 chose a grid layout, so expanding one card makes its
whole row taller and pushes everything below it down. The shift is downward, away
from the reader's focus, rather than yanking content out from under them.

Rejected: a popover, which avoids the shift and walks into this map's standing
finding — `backdrop-filter` traps `position: fixed`, so it must be portalled to
`document.body` and then collision-positioned against a card that scrolls.
Rejected: routing to the product page, which makes the button a duplicate of the
link already on the card's image and title, and leaves the charting grill's
finding untouched — *advice a user cannot act on is a lost sale*.

### 4. Inline confirmation, no cart drawer

The button becomes `✓ In your bag` in place. The header bag badge, which is
sticky and always visible, increments. Two signals, no interruption.

This deliberately departs from `ProductDetail.tsx:79`, which does
`onSuccess: () => openDrawer()`. That pattern was set on a page where the shopper
is *finished* — one product, added, drawer as a full stop. A chat message holds up
to five picks with a rationale on each; a shopper adding the second still has
three to read, and a full-height drawer covers exactly the content they are
working through. The whole justification for putting Add to Bag on the card was
acting *without leaving the conversation*, and a drawer over the conversation is
functionally leaving it.

Consistency is a means, not the goal. As a side effect this surface sidesteps the
portal question entirely.

### 5. Retrieval filters `stock > 0`; the card still handles zero

`ContextBuilder` filters on `embedding__isnull=False` and nothing else, so the
stylist currently can and does spend picks on unbuyable products. With `top_k =
5`, each wasted pick is 20% of the recommendation.

**On the apparent conflict with ticket 11**, which refused to hard-filter by size
or budget: size and budget mismatches are **caveats** — the item exists, and the
stylist adds judgement a filter cannot. `stock = 0` is **unavailability** — no
version can be bought, there is no advice to give, and this app has no notify-me
feature to fall back on.

Filtering is not sufficient on its own, and the card's disabled `Out of stock`
state stays regardless:

1. **Stock moves.** It can reach zero between the reply arriving and the shopper
   clicking, and `cart_service._assert_stock` rejects the add whatever the card
   shows.
2. **History replays.** Old conversations re-render old picks.
   `ChatMessage.products` has no idea a product went out of stock last week.
