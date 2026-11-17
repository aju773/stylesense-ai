"""Business rules for saved products.

Thin by design — a wishlist has no arithmetic and no stock to reason about, so
this layer exists for the two rules that are real: what may be saved, and who
may touch a given row.
"""

from django.db import IntegrityError, transaction

from apps.products.models import Product

from ..models import WishlistItem
from .exceptions import ProductUnavailable


def get_items(user):
    """A user's saved products, newest first, ready to serialize.

    `images` is prefetched because `ProductCardSerializer.get_image_url` walks
    it per card — without this the list is one query per saved product.
    """
    return (
        WishlistItem.objects.filter(user=user)
        .select_related("product__category")
        .prefetch_related("product__images")
    )


def _get_saveable_product(product_id: int) -> Product:
    try:
        return Product.objects.prefetch_related("images").get(
            pk=product_id, is_active=True
        )
    except Product.DoesNotExist as exc:
        raise ProductUnavailable("That product is no longer available.") from exc


@transaction.atomic
def toggle(*, user, product_id: int, source: str) -> tuple[bool, WishlistItem | None]:
    """Save the product, or unsave it if it is already saved.

    The heart on a product card is one control with two meanings, so the server
    decides which one happened and reports it back. The client never has to know
    the current state to send the right request — which also means a stale card
    (rendered before the product was saved in another tab) can't get it wrong.

    Returns `(saved, item)`; `item` is None when the product was removed.
    """
    product = _get_saveable_product(product_id)

    deleted, _ = WishlistItem.objects.filter(user=user, product=product).delete()
    if deleted:
        return False, None

    try:
        with transaction.atomic():
            item = WishlistItem.objects.create(
                user=user, product=product, source=source
            )
    except IntegrityError:
        item = WishlistItem.objects.get(user=user, product=product)

    return True, item


def get_owned_item(*, user, item_id: int) -> WishlistItem:
    """Fetch a saved row, scoped to the caller.

    Scoping the lookup rather than checking ownership afterwards means someone
    else's item id is indistinguishable from a nonexistent one — a 404 either
    way, leaking nothing about what other people have saved.
    """
    return WishlistItem.objects.select_related("product").get(pk=item_id, user=user)


def remove_item(*, user, item_id: int) -> None:
    get_owned_item(user=user, item_id=item_id).delete()
