"""Parsing for the inline product markers the AI emits in its replies.

The AI writes prose and cites catalog products with `[[product:<id>]]`.
Markers are a plain-text contract, so they survive token streaming and work
identically across every provider — see `SYSTEM_PROMPT` in `chat_service`.
"""

import re

MARKER_RE = re.compile(r"\[\[product:(\d+)\]\]")


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


def strip_markers(text: str) -> str:
    """Remove markers from text (for titles, previews, plain-text contexts)."""
    return MARKER_RE.sub("", text or "")
