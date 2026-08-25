# 11 — Style Profile: schema and prompt injection

Type: grilling
Status: resolved
Blocked by: —

## Question

What goes into `User.style_preferences`, and how does the AI stylist use it?

`User.style_preferences` is a `JSONField(default=dict)` that exists on the model
and is written by nothing and read by nothing.

Decide:

- **The schema.** `designs/page-profile` shows aesthetic vibe chips (Minimalist,
  Tailored, Bohemian, Streetwear, Monochrome), a top size, a bottom size, and a
  budget range. Decide the exact key names, value types, and which are optional.
  Decide whether the vibe vocabulary is a fixed list or user-extensible — the
  design draws an "Add Vibe" control.
- **Validation.** A `JSONField` accepts anything. Decide where the shape is
  enforced, and what happens to a profile written before a schema change.
- **How preferences reach the model.** Injected into `SYSTEM_PROMPT` per
  conversation, prepended to each message's context, or folded into the vector
  search in `context_builder.py`. Note that a stylist told "budget ₹150–600"
  will still be handed search results outside that range unless the retrieval
  step also knows.
- **Whether preferences filter retrieval or only steer tone.** Sizes are the
  sharp case: should a size-M shopper's search results exclude products with no
  M, or should the stylist mention the mismatch instead?
- **Empty profile behaviour.** Most users will have one. Decide whether the
  prompt changes at all when preferences are empty, and whether the stylist
  prompts the user to fill it in.
- **Whether the stylist can write back** to preferences from what it learns in
  conversation, or whether the profile page is the only writer.
- The **REST surface** for reading and updating preferences.

## Answer

Seven decisions.

### Starting state

- `User.style_preferences` is a `JSONField(default=dict, blank=True)` written by
  nothing and read by nothing.
- `UserSerializer` already **lists** `style_preferences` in its fields, but
  `read_only_fields = fields` makes the whole serializer read-only. Readable,
  structurally unwritable.
- `MeView` is a `generics.RetrieveAPIView` at `/api/auth/me/` — GET only.
- `SYSTEM_PROMPT` takes exactly one placeholder, `{product_context}`. Nothing
  about the user.
- `ContextBuilder.build_product_context(user_message)` embeds the message and
  nothing else. **It never receives the user.** Retrieval is anonymous.

### 1. Schema — adapted to the catalog, not to the design

Four keys: **vibes** (array), **size** (single value), **budget** (min/max in ₹),
**gender** (shopping preference).

`designs/page-profile` draws something the catalog cannot honour:

| Design | Catalog |
| --- | --- |
| Top Size `Medium (M)` **and** Bottom Size `US 6` | `Product.sizes` is one array, `XS`–`XXL`. No top/bottom split exists |
| Budget `$150 – $600+` | Prices are ₹1,800–₹10,000 |
| Aesthetic vibes | no catalog field describes one |
| *(absent)* | `gender` — Women 22 / Men 14 / Unisex 14 |

The top/bottom split is the clearest defect: a US numeric sizing system in an app
whose entire catalog is lettered, against a model with a single `sizes` list. It
is dropped. Budget is denominated in ₹. Gender is **added**, because it is the
most filterable attribute in the catalog and the design omits it while asking for
decorative preferences.

### 2. Closed vibe vocabulary

A fixed list of chips. The design's `+ ADD VIBE` free-text control is dropped.

Two reasons. **Security:** whatever lands in this field is interpolated into
`SYSTEM_PROMPT`, so free text is user-controlled input entering the model's
instructions — a prompt-injection surface. A closed list means the server only
ever interpolates strings it chose. Shipping free text would require length
limits, character restrictions, and placing the value as data rather than
instruction; real work, not a checkbox.

**Utility:** no catalog field describes a vibe and the descriptions are
boilerplate, so a vibe can only steer prose or be folded into the embedded query.
A closed list keeps the retrieval path open; arbitrary strings make it noise.

### 3. Validation in a DRF serializer; the field stays JSON

Explicit typed fields on a serializer at the boundary, matching where this
codebase already puts validation (HackSoft styleguide — services for logic,
serializers at the edge). `style_preferences` remains a `JSONField`.

Rejected: promoting the keys to real columns on `User`. Database-level guarantees
and SQL-filterability are genuine advantages, but the schema will change once
anyone uses it, and a migration per preference is the wrong trade this early.

Reads must tolerate missing **and** unknown keys — any profile written before a
schema change will have both.

### 4. Preferences reach both the prompt and retrieval; only gender filters hard

Three mechanisms, deliberately different in strength:

1. **Prompt block** — a `{user_profile}` section in `SYSTEM_PROMPT`.
2. **Soft steer** — vibes, gender and category intent folded into the text that
   `ContextBuilder` embeds, shifting what is semantically near. This is the only
   path by which a vibe can ever influence retrieval.
3. **Hard filter on `gender` only** — a real column with three clean values. A
   menswear kurta surfacing for a womenswear shopper is not a nuance, it is
   wrong. Filtering halves a 50-product pool and `top_k` is 5, so there is room.

**Size and budget deliberately do not filter.** Excluding by size means a perfect
item vanishes because one size sold out, with no way for the stylist to say *"this
is ideal but only in L"*. Excluding by budget means it can never show the ₹6,754
blazer worth the stretch. Both still reach the model through the prompt, so it
flags mismatches rather than hiding them — which is most of what a stylist is for.

This requires `ContextBuilder` to receive the user, which it currently does not.

### 5. Empty profile — say nothing, ask once

The prompt block is **omitted entirely** when preferences are empty, which is the
normal case, not the edge case. Plus one instruction permitting the stylist to
invite the shopper to set preferences when a recommendation would clearly
benefit — at most once per conversation.

This is the acquisition path. Nobody fills in a preferences form because a form
asked; they fill it in because something they were already using would be better
for it.

Rejected: an explicit *"no preferences on file"* line, which invites the model to
reference the absence far more often than intended — saying nothing is the
stronger instruction. And rejected: gating chat behind profile setup, which puts
a form in front of the headline feature.

### 6. Read-only — the profile page is the only writer

The stylist reads preferences and never writes them.

Rejected outright: inferring preferences from conversation and writing them
silently. That is model output mutating stored user data — the model misreads
*"I wouldn't normally wear streetwear"* as a streetwear preference, and every
later recommendation is wrong with no visible cause and nothing the shopper did.
Preference data belongs to the user and should not change without them knowing.

Rejected for scope: propose-and-confirm write-back, where the stylist offers to
save something and the user accepts. Genuinely the better product, but it needs
structured output or tool-calling — which this app has nowhere, its entire AI
contract being prose plus text markers — plus a confirmation affordance in the
stream and a write path with its own failure modes. **Recorded as out of scope
on the map** rather than forgotten.

### 7. REST — `MeView` becomes `RetrieveUpdateAPIView`

PATCH `/api/auth/me/` carries preferences alongside the rest of the profile.
`read_only_fields` narrows from `fields` to `("id", "email")` — email is the login
identifier and must not be writable here.

Smallest change that serves this ticket and ticket 12, which needs first and last
name editable regardless. Ownership is enforced by construction: `get_object`
already resolves to `request.user`, so no scoping bug is possible. One cache key
(`["me"]`) for one page.

Rejected: a separate `/api/auth/me/preferences/` endpoint — two round-trips and
two cache entries for one page, and sub-resources earn their place when the
resource is large or independently permissioned. This is one JSON column on the
current user.
