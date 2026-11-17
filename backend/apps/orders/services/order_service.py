"""Turning a bag into an order.

Placement is a single transaction that locks every product it is about to sell,
re-checks stock against those locked rows, decrements it, charges, writes the
order, and empties the cart. Any failure anywhere unwinds all of it.

None of the money is recomputed here. `apps.cart.services.cart_service` owns the
arithmetic and stays the only implementation of it — this module's job is to
make sure that arithmetic runs against rows nobody else can move underneath it.
"""

from collections import defaultdict

from django.db import transaction
from django.db.models import F

from apps.cart.services import cart_service
from apps.products.models import Product, ProductImage

from ..models import Order, OrderItem
from . import payment_service
from .exceptions import EmptyCart, StockConflict


def _primary_image_urls(product_ids) -> dict[int, str]:
    """Primary image per product, for the line snapshot. One query."""
    urls: dict[int, str] = {}
    images = ProductImage.objects.filter(product_id__in=product_ids).order_by(
        "product_id", "-is_primary", "display_order"
    )
    for image in images:
        urls.setdefault(image.product_id, image.image_url)
    return urls


def _stock_problems(items, locked: dict[int, Product]) -> list[dict]:
    """Every line that cannot be fulfilled — not just the first one found.

    Stock is checked per *product*, summed across lines: the same shirt in M and
    L are two lines drawing on one pool, and checking them independently would
    happily sell two units of a one-unit product.
    """
    wanted: dict[int, int] = defaultdict(int)
    for item in items:
        wanted[item.product_id] += item.quantity

    problems = []
    for item in items:
        product = locked.get(item.product_id)
        available = 0 if product is None else product.stock

        if product is None or not product.is_active:
            reason = "unavailable"
        elif wanted[item.product_id] > available:
            reason = "insufficient_stock"
        else:
            continue

        problems.append(
            {
                "item_id": item.id,
                "product_id": item.product_id,
                "product_name": item.product.name,
                "size": item.size,
                "color": item.color,
                "requested": wanted[item.product_id],
                "available": available,
                "reason": reason,
            }
        )
    return problems


@transaction.atomic
def place_order(*, user, payment_token: str = "") -> Order:
    """Place the caller's cart as an order. All-or-nothing.

    Raises `EmptyCart`, `StockConflict`, or `PaymentFailed` — and because the
    whole function is one transaction, every one of those leaves the database
    exactly as it found it: stock un-decremented, no order, cart untouched.
    """
    cart = cart_service.get_or_create_cart(user)
    items = list(cart_service.get_cart_items(cart))
    if not items:
        raise EmptyCart("Your bag is empty.")

    product_ids = sorted({item.product_id for item in items})
    image_urls = _primary_image_urls(product_ids)

    locked = Product.objects.select_for_update().in_bulk(product_ids)

    problems = _stock_problems(items, locked)
    if problems:
        raise StockConflict(problems)

    for item in items:
        item.product = locked[item.product_id]

    totals = cart_service.calculate_totals(items)

    for product_id, quantity in _units_per_product(items).items():
        Product.objects.filter(pk=product_id).update(stock=F("stock") - quantity)

    order = Order(user=user, **_totals_to_columns(totals))

    order.payment_reference = payment_service.charge(
        amount=totals["total"],
        order_number=order.order_number,
        token=payment_token,
    )
    order.save()

    OrderItem.objects.bulk_create(
        [
            OrderItem(
                order=order,
                product=item.product,
                product_name=item.product.name,
                product_brand=item.product.brand,
                product_slug=item.product.slug,
                image_url=image_urls.get(item.product_id, ""),
                size=item.size,
                color=item.color,
                quantity=item.quantity,
                list_price=item.product.price,
                unit_price=cart_service.line_unit_price(item),
            )
            for item in items
        ]
    )

    cart.items.all().delete()
    return order


def _units_per_product(items) -> dict[int, int]:
    totals: dict[int, int] = defaultdict(int)
    for item in items:
        totals[item.product_id] += item.quantity
    return totals


def _totals_to_columns(totals: dict) -> dict:
    """The four money columns an Order freezes, out of the cart's totals dict."""
    return {
        "subtotal": totals["subtotal"],
        "discount": totals["discount"],
        "shipping": totals["shipping"],
        "total": totals["total"],
    }


def get_orders(*, user):
    """The caller's orders, newest first, ready to serialize."""
    return (
        Order.objects.filter(user=user).prefetch_related("items").order_by("-placed_at")
    )


def get_owned_order(*, user, order_id: int) -> Order:
    """One order, scoped to the caller.

    Same rule as the cart's item lookup: scoping the query rather than checking
    ownership afterwards makes someone else's order id indistinguishable from a
    nonexistent one — 404 either way, leaking nothing about what other people
    have bought.
    """
    return Order.objects.prefetch_related("items").get(pk=order_id, user=user)


def advance_status(order: Order) -> bool:
    """Move an order one step along `Order.LIFECYCLE`. True if it moved.

    Terminal states (delivered, cancelled) stay put.
    """
    lifecycle = Order.LIFECYCLE
    if order.status not in lifecycle:
        return False
    index = lifecycle.index(order.status)
    if index + 1 >= len(lifecycle):
        return False
    order.status = lifecycle[index + 1]
    order.save(update_fields=["status", "updated_at"])
    return True
