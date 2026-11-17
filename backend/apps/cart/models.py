from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models


class Cart(models.Model):
    """One persistent bag per user.

    Carts are authenticated-only — there is no session/anonymous cart, which is
    what lets this be a plain OneToOne and removes merge-on-login entirely.
    """

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="cart",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Cart for {self.user.email}"


class CartItem(models.Model):
    """One line in a bag: a product in a specific size and color.

    Deliberately stores no price. The cart always reflects live catalog pricing;
    a snapshot only becomes correct at checkout, where it belongs on the order
    (epic 10). Storing it here would mean a cart that quietly bills yesterday's
    price after a markdown.
    """

    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey(
        "products.Product",
        on_delete=models.CASCADE,
        related_name="cart_items",
    )
    size = models.CharField(max_length=20, blank=True, default="")
    color = models.CharField(max_length=50, blank=True, default="")
    quantity = models.PositiveIntegerField(default=1, validators=[MinValueValidator(1)])
    added_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-added_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["cart", "product", "size", "color"],
                name="uniq_cart_product_variant",
            ),
            models.CheckConstraint(
                condition=models.Q(quantity__gte=1),
                name="cartitem_quantity_positive",
            ),
        ]

    def __str__(self):
        return f"{self.quantity} x {self.product.name} ({self.size}/{self.color})"
