class CartError(Exception):
    """Base for cart business-rule violations, mapped to 400 by the views."""


class ProductUnavailable(CartError):
    """Product does not exist, or is no longer in the active catalog."""


class InvalidVariant(CartError):
    """Requested size/color is not one this product is sold in."""


class InsufficientStock(CartError):
    """Requested quantity exceeds what the catalog says is on hand."""
