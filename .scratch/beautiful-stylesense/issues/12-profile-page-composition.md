# 12 — Profile page composition

Type: prototype
Status: resolved
Blocked by: 05, 11

## Question

What does `/profile` look like, given that Security & Access is out of scope?

`designs/page-profile` draws a left account nav (Personal Info, My Orders,
Wishlist, Style Preferences, AI Chat History, Security, Sign Out) beside a long
scrolling page of three bands. Two of those bands survive this effort's scope.

Build a rough prototype, then decide:

- **Whether the left account nav ships**, and what it contains. It duplicates
  `/orders` and `/wishlist`, which already exist as top-level routes reachable
  from `SiteHeader`. "AI Chat History" duplicates the conversation sidebar
  already inside `/chat`. Decide whether this becomes a real account shell that
  those routes nest inside, or whether Profile is a single flat page.
- **Layout with Security removed.** Two bands may not justify the design's long
  scroll; decide the resulting composition.
- **Personal Information fields.** Only first name, last name, and email exist
  on the model. Decide whether the band is editable, and what a read-only email
  looks like given it is the login identifier.
- **Style Profile controls.** The vibe chips, two size selects, and a
  dual-handle budget slider from ticket 11's schema. The app owns no slider
  component today; decide whether the budget range is a slider, two inputs, or
  preset bands.
- **Save behaviour.** Per-band save buttons as the design draws, autosave, or a
  single page-level save.
- **How the page tells the shopper why this matters.** The design carries a
  callout explaining that preferences improve recommendations; decide whether
  that ships and whether it links into `/chat`.
- **Sign Out placement**, which currently lives in `SiteHeader`.

## Prototype

Captured on branch **`prototype/beautiful-stylesense`** (commit `3680b78`), off `main`. The files below do not exist on `main` — check the branch out to run them.

`frontend/src/pages/prototype/ProfilePrototype.tsx`, routed at
`/prototype/profile?v=a|b|c|d`. Throwaway — delete with its route in `App.tsx`.

Four compositions, plus live toggles for the budget control
(`slider` / `inputs` / `bands`), save mode (`per-band` / `page` / `autosave`),
the explanatory callout, and a dump of the `style_preferences` payload. Schema is
ticket 11's exactly — ten closed vibe chips, one size `XS`–`XXL`, `Shopping for`,
and a ₹ budget.

## Answer

### 1. Variant C — style-first, account details behind a disclosure

The Style Profile is the page. Personal Information collapses into an
`Account details` disclosure beneath it.

Two things the prototype made obvious:

**The account nav has nothing to hold.** With Security & Access out of scope, the
design's seven-item sidebar reduces to **two real tabs** — Personal Info and
Style Profile — plus My Orders and Wishlist, which are top-level routes already
reachable from `SiteHeader`, so those entries only navigate away. A nav where
half the items exit the page is a table of contents pretending to be an app
shell.

**Personal Information is three fields.** First name, last name, and a disabled
email — `User` has nothing else. Beside the Style Profile it reads as a footnote,
and a disclosure is honest about that.

The deciding argument is hierarchy. Decision 8 of the charting grill put Profile
in scope because `style_preferences` turns the stylist from generic into
personal; ticket 08 leaned on the same reasoning. C is the only composition whose
layout says that. Editing a surname is not why anyone opens this page.

D was the runner-up and gives Personal Information more visual weight than three
fields have earned.

**Forced by C:** with no account nav, **Sign Out stays in `SiteHeader`** where it
already lives.

### 2. Budget as preset bands

Three chips mapping to `min`/`max`, in the same chip language as vibes, size and
Shopping for — so the whole Style Profile becomes one consistent interaction.

**Ticket 11 decided budget does not filter retrieval.** It is advisory, reaching
the model as prompt context so the stylist can say *"over budget and worth it"*.
Nothing consumes the number precisely, so a control expressing `₹2,500 – ₹7,000`
and one expressing `₹3,000 – ₹6,000` produce identical behaviour. **The slider's
precision has no consumer.**

What it would have cost: the project owns no slider component. The dual-range in
the prototype is two stacked `<input type="range">` with pointer-events juggling —
about 25 lines of fiddly CSS plus keyboard and touch testing it has not had, on a
page where nothing else needs a custom control.

Revisit this if budget ever becomes a real filter.

**To settle in implementation:** bands as drawn are mutually exclusive, so a
shopper wanting "anything under ₹6,000" spans two. Either the bands overlap
sensibly or one of them is `Any`.

### 3. One page-level save

A single save bar, visible whenever anything is dirty, reading *"You have
unsaved changes"*.

Per-band saving is unsafe under variant C: the Personal Information button lives
*inside* a disclosure that is collapsed by default. Edit a name, collapse it, and
the button is gone with nothing on screen saying the change is unsaved.

Page-level also matches the API exactly. Ticket 11 decided the write path is a
single `PATCH /api/auth/me/` carrying preferences and name together, so per-band
saving would fire the same whole-object PATCH twice while pretending they are
separate resources. One dirty flag, one mutation, one invalidation of `["me"]`.

Rejected: autosave. Every vibe chip is a toggle, so it means a PATCH per click
unless debounced, and it removes the one moment where the shopper knows their
preferences took effect. It suits a page you fiddle with continuously; this is a
page you set up and leave.

### 4. The callout ships, rewritten, linking to the stylist

The design's copy claims the preferences create *"bespoke lookbooks tailored
exactly to your aesthetic and fit"*. There is no lookbook feature and nothing
generates one — the same class of overclaim ticket 08 cut from the home page's
AI cards.

The replacement states the actual mechanism: the stylist searches only what the
shopper shops for, and **tells them** when something is outside their size or
budget rather than hiding it. That is true, specific, verifiable in one
conversation, and it explains a deliberate design decision from ticket 11 the
shopper would otherwise never see.

It links to `/chat`, closing the loop ticket 11 decision 5 opened — the stylist
may invite the shopper here, and the callout sends them back. Since an empty
profile is the normal case, this panel is the strongest argument the page can
make for filling it in.
