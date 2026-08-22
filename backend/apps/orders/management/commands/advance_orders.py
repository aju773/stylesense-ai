"""Nudge orders along their lifecycle.

There is no warehouse and no carrier webhook, so nothing would ever move an
order past "Processing" on its own and the history page would show a column of
identical rows forever. This command stands in for the events a real system
would receive.
"""

from django.core.management.base import BaseCommand, CommandError

from apps.orders.models import Order
from apps.orders.services import order_service


class Command(BaseCommand):
    help = "Advance orders one step along processing → shipped → delivered."

    def add_arguments(self, parser):
        parser.add_argument(
            "--order-number",
            help="Advance only this order (default: every eligible order).",
        )
        parser.add_argument(
            "--to",
            choices=[status.value for status in Order.LIFECYCLE],
            help="Advance repeatedly until this status is reached.",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Report what would move without touching anything.",
        )

    def handle(self, *args, **options):
        orders = Order.objects.filter(status__in=Order.LIFECYCLE)
        if options["order_number"]:
            orders = orders.filter(order_number=options["order_number"])
            if not orders.exists():
                raise CommandError(
                    f"No advanceable order {options['order_number']!r}. "
                    "It may not exist, or may already be delivered or cancelled."
                )

        target = options["to"]
        moved = 0

        for order in orders:
            before = order.status
            if options["dry_run"]:
                after = self._preview(order, target)
            else:
                after = self._advance(order, target)

            if after != before:
                moved += 1
                self.stdout.write(f"  {order.order_number}: {before} → {after}")

        prefix = "Would advance" if options["dry_run"] else "Advanced"
        self.stdout.write(
            self.style.SUCCESS(f"{prefix} {moved} order{'' if moved == 1 else 's'}.")
        )

    def _advance(self, order: Order, target: str | None) -> str:
        """One step, or as many steps as it takes to reach `target`."""
        if not target:
            order_service.advance_status(order)
            return order.status
        while order.status != target and order_service.advance_status(order):
            pass
        return order.status

    def _preview(self, order: Order, target: str | None) -> str:
        lifecycle = [status.value for status in Order.LIFECYCLE]
        index = lifecycle.index(order.status)
        if target:
            return target if lifecycle.index(target) > index else order.status
        return lifecycle[min(index + 1, len(lifecycle) - 1)]
