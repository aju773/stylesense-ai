from django.core.management.base import BaseCommand

from apps.products.models import Product
from apps.products.services.embedding_service import GeminiEmbeddingService


class Command(BaseCommand):
    help = "Generate and store Gemini embeddings for products missing vectors"

    def handle(self, *args, **options):
        service = GeminiEmbeddingService()
        products = Product.objects.filter(embedding__isnull=True)
        total = products.count()
        self.stdout.write(f"Found {total} products needing embeddings.")
        embedded = 0
        for product in products:
            text = f"{product.name}. {product.description}"
            try:
                vector = service.generate_embedding(text)
                product.embedding = vector
                product.save(update_fields=["embedding"])
                embedded += 1
                self.stdout.write(
                    self.style.SUCCESS(f"  [{embedded}/{total}] {product.name}")
                )
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"  Failed: {product.name} — {e}"))
        self.stdout.write(
            self.style.SUCCESS(f"\nDone. Embedded {embedded}/{total} products.")
        )
