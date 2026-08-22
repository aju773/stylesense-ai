class WishlistError(Exception):
    """Base for wishlist business-rule violations, mapped to 400 by the views."""


class ProductUnavailable(WishlistError):
    """Product does not exist, or is no longer in the active catalog."""
