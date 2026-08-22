from django.conf import settings
from django.db import models


class WishlistItem(models.Model):
    """One saved product.

    There is deliberately no parent `Wishlist` model the way there is a `Cart`.
    A cart owns totals and per-bag state, so the parent row carries something; a
    wishlist owns nothing but its set of items, and a parent would be a join
    table with no columns worth reading.

    Uniqueness is `(user, product)` rather than the cart's
    `(cart, product, size, color)`: you save a *product*, not a variant. Picking
    a size is an add-to-bag decision, made on the product page where a picker
    already exists — saving the same coat in three sizes would just be the same
    coat three times.
    """

    class Source(models.TextChoices):
        MANUAL = "manual", "Manually saved"
        AI = "ai", "AI picked"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="wishlist_items",
    )
    # CASCADE, unlike OrderItem's SET_NULL + snapshot. An order line is an
    # accounting record that has to survive the catalog; a wishlist entry is a
    # pointer into the live catalog, and a saved product that no longer exists
    # is nothing a user could act on.
    product = models.ForeignKey(
        "products.Product",
        on_delete=models.CASCADE,
        related_name="wishlist_items",
    )
    # What the page's two tabs read. An item is `ai` only when it was hearted
    # off a recommendation card in chat — the assistant never writes here on its
    # own, so "AI Picked" means "the AI suggested it and you kept it".
    source = models.CharField(
        max_length=10,
        choices=Source.choices,
        default=Source.MANUAL,
    )
    added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-added_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["user", "product"],
                name="uniq_wishlist_user_product",
            ),
        ]
        indexes = [
            # The list endpoint always filters by user and the AI tab filters by
            # source on top of it.
            models.Index(fields=["user", "source"], name="wishlist_user_source_idx"),
        ]

    def __str__(self):
        return f"{self.user.email} saved {self.product.name} ({self.source})"
