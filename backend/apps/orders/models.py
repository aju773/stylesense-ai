import secrets

from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models
from django.utils import timezone


def generate_order_number() -> str:
    """Human-quotable reference, e.g. `SS-20260822-7K2Q`.

    Sequential ids are the primary key's job; this is the string a customer
    reads out on the phone. The random suffix keeps two orders placed on the
    same day from colliding without exposing how many orders the shop has taken.
    """
    stamp = timezone.localdate().strftime("%Y%m%d")
    suffix = "".join(
        secrets.choice("ABCDEFGHJKLMNPQRSTUVWXYZ23456789") for _ in range(4)
    )
    return f"SS-{stamp}-{suffix}"


class Order(models.Model):
    """A placed order: the cart frozen at the moment money changed hands.

    Everything monetary here is a snapshot. The cart deliberately stores no
    prices and always reflects live catalog pricing (see `apps.cart.models`);
    this is the other half of that decision — once placed, an order must keep
    billing what it billed, whatever the catalog does afterwards.
    """

    class Status(models.TextChoices):
        PROCESSING = "processing", "Processing"
        SHIPPED = "shipped", "Shipped"
        DELIVERED = "delivered", "Delivered"
        CANCELLED = "cancelled", "Cancelled"

    LIFECYCLE = [Status.PROCESSING, Status.SHIPPED, Status.DELIVERED]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="orders",
    )
    order_number = models.CharField(
        max_length=20, unique=True, default=generate_order_number, editable=False
    )
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.PROCESSING
    )

    subtotal = models.DecimalField(max_digits=12, decimal_places=2)
    discount = models.DecimalField(max_digits=12, decimal_places=2)
    shipping = models.DecimalField(max_digits=12, decimal_places=2)
    total = models.DecimalField(max_digits=12, decimal_places=2)

    payment_reference = models.CharField(max_length=64, blank=True, default="")
    placed_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-placed_at"]
        indexes = [
            models.Index(fields=["user", "-placed_at"], name="order_user_recent_idx"),
        ]

    def __str__(self):
        return f"{self.order_number} ({self.user.email})"

    @property
    def item_count(self) -> int:
        """Units across all lines — derived, not stored, so it cannot drift."""
        return sum(item.quantity for item in self.items.all())


class OrderItem(models.Model):
    """One purchased line, priced as it was priced when it was bought.

    Snapshots the product's descriptive fields alongside its price: the product
    FK is SET_NULL, so a delisted or deleted product empties the link but leaves
    the order history perfectly readable.
    """

    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey(
        "products.Product",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="order_items",
    )

    product_name = models.CharField(max_length=255)
    product_brand = models.CharField(max_length=100)
    product_slug = models.SlugField(max_length=255)
    image_url = models.URLField(blank=True, default="")

    size = models.CharField(max_length=20, blank=True, default="")
    color = models.CharField(max_length=50, blank=True, default="")
    quantity = models.PositiveIntegerField(validators=[MinValueValidator(1)])

    list_price = models.DecimalField(max_digits=10, decimal_places=2)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        ordering = ["id"]
        constraints = [
            models.CheckConstraint(
                condition=models.Q(quantity__gte=1),
                name="orderitem_quantity_positive",
            ),
        ]

    def __str__(self):
        return f"{self.quantity} x {self.product_name} ({self.size}/{self.color})"

    @property
    def line_total(self):
        return self.unit_price * self.quantity
