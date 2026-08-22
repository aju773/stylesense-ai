"""Business rules for the shopping bag.

Every rule that decides what a bag may contain, and every rupee of arithmetic,
lives here. The views do request/response translation only — the client is never
the source of truth on price, discount, or stock.
"""

from decimal import Decimal

from django.db import transaction

from apps.products.models import Product

from ..models import Cart, CartItem
from .exceptions import InsufficientStock, InvalidVariant, ProductUnavailable

# Bounded so a fat-fingered or scripted quantity can't create an absurd line.
MAX_QUANTITY_PER_LINE = 10


def get_or_create_cart(user) -> Cart:
    cart, _ = Cart.objects.get_or_create(user=user)
    return cart


def get_cart_items(cart: Cart):
    """Cart lines with everything the serializer needs already loaded."""
    return cart.items.select_related("product__category").prefetch_related(
        "product__images"
    )


def line_unit_price(item: CartItem) -> Decimal:
    """What one unit of this line actually costs today."""
    product = item.product
    if product.discount_price is not None:
        return product.discount_price
    return product.price


def calculate_totals(items) -> dict:
    """Server-side money math, computed from live catalog prices.

    `subtotal` is list price before markdowns, `discount` is what those markdowns
    take off, and `total` is what the customer pays. Shipping is free for now, so
    it is reported rather than computed.
    """
    subtotal = Decimal("0.00")
    discount = Decimal("0.00")
    count = 0

    for item in items:
        quantity = item.quantity
        list_price = item.product.price
        paid_price = line_unit_price(item)
        subtotal += list_price * quantity
        discount += (list_price - paid_price) * quantity
        count += quantity

    return {
        "subtotal": subtotal,
        "discount": discount,
        "shipping": Decimal("0.00"),
        "total": subtotal - discount,
        "item_count": count,
        "line_count": len(items),
    }


def _validate_variant(product: Product, size: str, color: str) -> None:
    """A bag line must name a variant the product is actually sold in."""
    if product.sizes and size not in product.sizes:
        raise InvalidVariant(f"'{size or '(none)'}' is not an available size.")
    if product.colors and color not in product.colors:
        raise InvalidVariant(f"'{color or '(none)'}' is not an available color.")


def _assert_stock(product: Product, quantity: int) -> None:
    if quantity > product.stock:
        raise InsufficientStock(
            f"Only {product.stock} left in stock." if product.stock else "Out of stock."
        )


@transaction.atomic
def add_item(
    *, user, product_id: int, size: str, color: str, quantity: int
) -> CartItem:
    """Add a variant to the bag, or bump the quantity of the line already there."""
    try:
        product = Product.objects.get(pk=product_id, is_active=True)
    except Product.DoesNotExist as exc:
        raise ProductUnavailable("That product is no longer available.") from exc

    _validate_variant(product, size, color)

    cart = get_or_create_cart(user)
    # select_for_update: two concurrent adds of the same variant would otherwise
    # both read the old quantity and one increment would be lost.
    existing = (
        CartItem.objects.select_for_update()
        .filter(cart=cart, product=product, size=size, color=color)
        .first()
    )

    new_quantity = (existing.quantity if existing else 0) + quantity
    new_quantity = min(new_quantity, MAX_QUANTITY_PER_LINE)
    _assert_stock(product, new_quantity)

    if existing:
        existing.quantity = new_quantity
        existing.save(update_fields=["quantity", "updated_at"])
        item = existing
    else:
        item = CartItem.objects.create(
            cart=cart,
            product=product,
            size=size,
            color=color,
            quantity=new_quantity,
        )

    return item


def get_owned_item(*, user, item_id: int) -> CartItem:
    """Fetch a line, scoped to the caller's own cart.

    Scoping the lookup rather than checking ownership afterwards means someone
    else's item id is indistinguishable from a nonexistent one — a 404 either
    way, leaking nothing about what other carts contain.
    """
    return CartItem.objects.select_related("product").get(pk=item_id, cart__user=user)


@transaction.atomic
def update_item_quantity(*, user, item_id: int, quantity: int) -> CartItem:
    item = get_owned_item(user=user, item_id=item_id)
    _assert_stock(item.product, quantity)
    item.quantity = quantity
    item.save(update_fields=["quantity", "updated_at"])
    return item


def remove_item(*, user, item_id: int) -> None:
    item = get_owned_item(user=user, item_id=item_id)
    item.delete()


def clear_cart(*, user) -> None:
    cart = get_or_create_cart(user)
    cart.items.all().delete()
