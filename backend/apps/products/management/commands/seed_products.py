import json
from pathlib import Path

from django.core.management.base import BaseCommand
from django.utils.text import slugify

from apps.products.models import Category, Product, ProductImage


class Command(BaseCommand):
    help = "Seed products from docs/products.json"

    def handle(self, *args, **options):
        json_path = (
            Path(__file__).resolve().parent.parent.parent.parent.parent.parent
            / "docs"
            / "products.json"
        )

        with open(json_path) as f:
            products_data = json.load(f)

        created_count = 0
        skipped_count = 0
        images_created_count = 0

        for item in products_data:
            # Get or create category
            category_name = item["category"]
            category, _ = Category.objects.get_or_create(
                slug=slugify(category_name),
                defaults={"name": category_name},
            )

            # Get or create product
            product, created = Product.objects.get_or_create(
                slug=slugify(item["name"]),
                defaults={
                    "name": item["name"],
                    "description": item.get("description", ""),
                    "price": item["price"],
                    "discount_price": item.get("discount_price"),
                    "brand": item.get("brand", ""),
                    "sizes": item.get("sizes", []),
                    "colors": item.get("colors", []),
                    "gender": item.get("gender", "Unisex"),
                    "stock": item.get("stock", 0),
                    "rating": item.get("rating", 0),
                    "category": category,
                },
            )

            if created:
                created_count += 1
            else:
                skipped_count += 1

            # Images are seeded independently of whether the product itself
            # was just created — get_or_create above skips existing products
            # on every re-run, but an already-seeded database still needs its
            # ProductImage rows populated. Keying on (product, display_order)
            # keeps this idempotent: re-running the command never duplicates
            # rows, whether the product is new or 49 sub-tickets old.
            for order, image_url in enumerate(item.get("images", [])):
                _, image_created = ProductImage.objects.get_or_create(
                    product=product,
                    display_order=order,
                    defaults={
                        "image_url": image_url,
                        "is_primary": order == 0,
                    },
                )
                if image_created:
                    images_created_count += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Done: {created_count} created, {skipped_count} skipped, "
                f"{images_created_count} images created"
            )
        )
