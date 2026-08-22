class OrderError(Exception):
    """Base for order business-rule violations, mapped to 4xx by the views."""


class EmptyCart(OrderError):
    """Nothing to place an order for."""


class StockConflict(OrderError):
    """One or more lines could not be fulfilled at placement time.

    Placement is all-or-nothing, so this aborts the whole order — but it carries
    every failing line rather than just the first, so the cart page can annotate
    each offending row instead of making the customer discover them one at a
    time.
    """

    def __init__(self, lines: list[dict]):
        self.lines = lines
        count = len(lines)
        super().__init__(
            f"{count} item{'' if count == 1 else 's'} in your bag "
            "changed availability. Nothing was charged."
        )


class PaymentFailed(OrderError):
    """The gateway declined the charge. Nothing was committed."""

    def __init__(self, message: str, code: str = "declined"):
        self.code = code
        super().__init__(message)
