"""Parsing for the inline product markers the AI emits in its replies.

The AI writes prose and cites catalog products with `[[product:<id>]]`, then
optionally justifies each pick with a `[[why:<id>]] <reason>` line. Both are a
plain-text contract, so they survive token streaming and work identically
across every provider — see `SYSTEM_PROMPT` in `chat_service`.
"""

import re

MARKER_RE = re.compile(r"\[\[product:(\d+)\]\]")
WHY_RE = re.compile(r"^\[\[why:(\d+)\]\][ \t]*(.+)$", re.MULTILINE)
WHY_MAX_LENGTH = 200


def extract_product_ids(text: str) -> list[int]:
    """Return cited product ids in order of first appearance, deduplicated.

    The model can disobey the prompt contract, so callers must still validate
    these ids against the database — hallucinated ids simply won't match a row.
    """
    seen = []
    for match in MARKER_RE.finditer(text or ""):
        product_id = int(match.group(1))
        if product_id not in seen:
            seen.append(product_id)
    return seen


def extract_reasons(text: str) -> dict[int, str]:
    """Return {product_id: reason} for well-formed `[[why:<id>]]` lines.

    This is an enhancement, not a dependency: a product id with no matching
    line here just gets no reason, never an error. A blank reason is treated
    as malformed and dropped; an over-long one is clamped rather than dropped,
    since the model exceeding the prompt's ~120-character target still wrote
    something worth showing.
    """
    reasons: dict[int, str] = {}
    for match in WHY_RE.finditer(text or ""):
        reason = match.group(2).strip()
        if not reason:
            continue
        if len(reason) > WHY_MAX_LENGTH:
            reason = reason[:WHY_MAX_LENGTH].rstrip() + "…"
        reasons[int(match.group(1))] = reason
    return reasons


def strip_markers(text: str) -> str:
    """Remove markers from text (for titles, previews, plain-text contexts)."""
    return MARKER_RE.sub("", text or "")
