"""A deliberately fake payment gateway.

There is no real processor behind this and there never will be — but an
always-succeeds stub would leave the interesting half of checkout untested. The
stock decrement, the row locks, and the order write all have to unwind cleanly
when a charge is declined, and that path only gets exercised if a decline can
actually be produced on demand.

So this stub does two things a stub normally doesn't: it takes a realistic
moment to answer, and it declines when handed a sentinel token.
"""

import secrets
import time
from decimal import Decimal

from django.conf import settings

from .exceptions import PaymentFailed

# Hand this in as the payment token to force a decline. The checkout UI offers
# it behind a "simulate a declined payment" toggle.
DECLINE_TOKEN = "tok_decline"

# Anything else is accepted, including an empty token.
DEFAULT_TOKEN = "tok_demo_visa"


def charge(*, amount: Decimal, order_number: str, token: str = "") -> str:
    """Charge `amount` and return a gateway reference, or raise `PaymentFailed`.

    Called from inside the placement transaction. See `order_service.place_order`
    for why the latency below is paid while row locks are held.
    """
    latency = settings.MOCK_PAYMENT_LATENCY_SECONDS
    if latency:
        time.sleep(latency)

    if token == DECLINE_TOKEN:
        raise PaymentFailed(
            "Your card was declined. Nothing was charged and your bag is intact.",
            code="card_declined",
        )

    if amount <= 0:
        raise PaymentFailed("Nothing to charge.", code="invalid_amount")

    return f"pay_{secrets.token_hex(8)}"
