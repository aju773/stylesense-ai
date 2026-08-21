# Research: Implementing Vector Search with pgvector and Gemini Embeddings in Django

## Primary Sources & Documentation
- **pgvector GitHub Repository**: [github.com/pgvector/pgvector](https://github.com/pgvector/pgvector)
- **pgvector-python PyPI Package**: [pypi.org/project/pgvector](https://pypi.org/project/pgvector/) / [github.com/pgvector/pgvector-python](https://github.com/pgvector/pgvector-python)
- **Google GenAI SDK Documentation**: [googleapis.github.io/python-genai](https://googleapis.github.io/python-genai/)
- **Google GenAI Python SDK Repo**: [github.com/googleapis/python-genai](https://github.com/googleapis/python-genai)
- **Google Gemini API Embedding Docs**: [ai.google.dev/gemini-api/docs/embeddings](https://ai.google.dev/gemini-api/docs/embeddings)
- **Google Gemini Pricing & Quotas**: [ai.google.dev/pricing](https://ai.google.dev/pricing)

---

## 1. pgvector PostgreSQL Extension

### Overview
`pgvector` is an open-source extension for PostgreSQL that enables vector similarity search directly within Postgres. It supports L2 distance (`<->`), cosine distance (`<=>`), inner product (`<#>`), L1 distance (`<+>`), Hamming distance (`<~>`), and Jaccard distance (`<%>`).

### Cosine Distance & Similarity Formula
In `pgvector`, cosine distance is computed using the `<=>` operator:

$$\text{Cosine Distance} = 1 - \text{Cosine Similarity}$$

To rank items by similarity, sort by Cosine Distance in ascending order (smaller distance = higher similarity). To obtain exact cosine similarity value:

$$\text{Cosine Similarity} = 1 - (\text{embedding} \mathbin{\text{<=>}} \text{query\_vector})$$

### Vector Operations in SQL
```sql
-- Enable the extension in your database
CREATE EXTENSION IF NOT EXISTS vector;

-- Create table with vector column (768 dimensions for Gemini text-embedding-004)
CREATE TABLE products (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    embedding vector(768)
);

-- Cosine similarity query (top 5 most similar items)
SELECT name, description, 1 - (embedding <=> '[0.012, -0.045, ...]') AS similarity
FROM products
ORDER BY embedding <=> '[0.012, -0.045, ...]' ASC
LIMIT 5;
```

### Indexing: HNSW vs. IVFFlat
- **HNSW (Hierarchical Navigable Small World)**: Recommended for most applications. Builds a multi-layer graph. Faster query performance, higher recall, no need to train on dataset.
- **IVFFlat (Inverted File Flat)**: Divides vector space into lists. Requires data to be present before index creation (or re-indexing after data changes).

```sql
-- Create HNSW index using cosine distance operator class (vector_cosine_ops)
CREATE INDEX ON products USING hnsw (embedding vector_cosine_ops) WITH (m = 16, ef_construction = 64);
```

---

## 2. pgvector Ready-Made Docker Image

### Official Docker Image
The `pgvector` project maintains official Docker images on Docker Hub:
- **Image**: `pgvector/pgvector:pg16` (also available: `pgvector/pgvector:pg17`, `pgvector/pgvector:pg15`)
- **Docker Registry**: `docker.io/pgvector/pgvector`

### Integration into Docker Compose (`compose.yml`)
You can replace the standard `postgres:16-alpine` image in `compose.yml` with `pgvector/pgvector:pg16`:

```yaml
services:
  db:
    image: pgvector/pgvector:pg16
    container_name: stylesense_db
    restart: always
    environment:
      POSTGRES_DB: stylesense
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgrespassword
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -d stylesense"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
```

---

## 3. Django Integration (`pgvector-python`)

### Package Details
- **PyPI Package**: `pgvector` (`pip install pgvector` / `uv add pgvector`)
- **Django Subpackage**: `pgvector.django`

### Adding `VectorField` to Django Model
```python
from django.db import models
from pgvector.django import VectorField, HnswIndex

class Product(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    # Gemini text-embedding-004 uses 768 dimensions
    embedding = VectorField(dimensions=768, null=True, blank=True)

    class Meta:
        indexes = [
            HnswIndex(
                name="product_embedding_hnsw_idx",
                fields=["embedding"],
                m=16,
                ef_construction=64,
                opclasses=["vector_cosine_ops"],
            )
        ]

    def __str__(self):
        return self.name
```

### Django Extension Migration
To enable the extension in PostgreSQL when running `python manage.py migrate`, create an empty migration and add `VectorExtension()`:

```python
# apps/products/migrations/0002_enable_vector_extension.py
from django.db import migrations
from pgvector.django import VectorExtension

class Migration(migrations.Migration):

    dependencies = [
        ('products', '0001_initial'),
    ]

    operations = [
        VectorExtension(),
    ]
```

### Performing Cosine Similarity Search in Django ORM
```python
from pgvector.django import CosineDistance
from apps.products.models import Product

def search_similar_products(query_vector: list[float], top_k: int = 5, max_distance: float = 0.5):
    """
    Search products ordered by Cosine Distance to query_vector.
    CosineDistance is 0 for identical vectors and 1 for orthogonal vectors.
    """
    return (
        Product.objects.exclude(embedding__isnull=True)
        .annotate(distance=CosineDistance("embedding", query_vector))
        .filter(distance__lt=max_distance)
        .order_by("distance")[:top_k]
    )
```

---

## 4. Google Gemini Embedding API (`google-genai` SDK)

### Current Official SDK
- **Package**: `google-genai` (DO NOT use deprecated `google-generativeai`)
- **Primary Embedding Model**: `text-embedding-004`
- **Output Dimension**: **768 dimensions** by default.
- **Flexible Dimensions**: Supports Matryoshka Representation Learning (MRL), allowing down-sizing (e.g., to 512, 256) via `types.EmbedContentConfig(output_dimensionality=768)`.

### Synchronous Text Embedding
```python
from google import genai
from google.genai import types

client = genai.Client()  # Reads GEMINI_API_KEY from environment

response = client.models.embed_content(
    model="text-embedding-004",
    contents="Men's black leather motorcycle jacket with zip closure",
    config=types.EmbedContentConfig(output_dimensionality=768),
)

# Single embedding vector (list of 768 floats)
vector: list[float] = response.embedding.values
```

### Asynchronous Text Embedding (`client.aio`)
The `google-genai` SDK natively supports async embeddings via `client.aio.models.embed_content()`:

```python
from google import genai
from google.genai import types

async def get_embedding_async(text: str) -> list[float]:
    client = genai.Client()
    response = await client.aio.models.embed_content(
        model="text-embedding-004",
        contents=text,
        config=types.EmbedContentConfig(output_dimensionality=768),
    )
    return response.embedding.values
```

### Batch Embedding Multiple Texts
```python
response = client.models.embed_content(
    model="text-embedding-004",
    contents=[
        "Men's casual slim fit denim shirt",
        "Women's floral summer dress",
    ],
)

# Extract list of vector lists
vectors: list[list[float]] = [e.values for e in response.embeddings]
```

---

## 5. Free Tier Limits for Gemini Embeddings

According to official Google AI Studio pricing and quota specifications:

| Parameter | Free Tier Limit | Paid Tier Limit |
| :--- | :--- | :--- |
| **Requests Per Minute (RPM)** | **1,500 RPM** | 1,500+ RPM |
| **Requests Per Day (RPD)** | **1,500 RPD** | Unlimited |
| **Tokens Per Minute (TPM)** | **1,000,000 TPM** | 1,000,000+ TPM |
| **Price per 1,000,000 Tokens** | **$0.00 (Free)** | $0.02 / 1M tokens |

> [!NOTE]
> Unlike Gemini text generation models (which have a strict 15 RPM limit on the free tier), `text-embedding-004` has a significantly higher rate limit of **1,500 RPM**, making free-tier embedding generation for hundreds of product catalog items fast and feasible.

---

## 6. End-to-End Django Implementation Architecture

### File Structure Layout
```
apps/products/
├── management/
│   └── commands/
│       └── seed_embeddings.py    # Seed time vector generator
├── migrations/
│   └── 0002_vector_extension.py # VectorExtension migration
├── models.py                    # Product model with VectorField & HnswIndex
└── services/
    ├── embedding_service.py     # Gemini client wrapper for embeddings
    └── vector_search.py         # Similarity query service layer
```

### Code Walkthrough

#### Step 1: Embedding Service (`apps/products/services/embedding_service.py`)
```python
import logging
from google import genai
from google.genai import types
from google.genai.errors import APIError
from django.conf import settings

logger = logging.getLogger(__name__)

class GeminiEmbeddingService:
    def __init__(self, model_name: str = "text-embedding-004", dimensions: int = 768):
        self.model_name = model_name
        self.dimensions = dimensions
        self.client = genai.Client(api_key=getattr(settings, "GEMINI_API_KEY", None))

    def generate_embedding(self, text: str) -> list[float]:
        """Generate a single text embedding vector (768 dimensions)."""
        try:
            response = self.client.models.embed_content(
                model=self.model_name,
                contents=text,
                config=types.EmbedContentConfig(output_dimensionality=self.dimensions),
            )
            return response.embedding.values
        except APIError as e:
            logger.error(f"Gemini API error during embedding generation: {e}")
            raise

    async def generate_embedding_async(self, text: str) -> list[float]:
        """Async version for async Django views / tasks."""
        try:
            response = await self.client.aio.models.embed_content(
                model=self.model_name,
                contents=text,
                config=types.EmbedContentConfig(output_dimensionality=self.dimensions),
            )
            return response.embedding.values
        except APIError as e:
            logger.error(f"Gemini API async error: {e}")
            raise
```

#### Step 2: Ingestion / Seed Command (`apps/products/management/commands/seed_embeddings.py`)
```python
from django.core.management.base import BaseCommand
from apps.products.models import Product
from apps.products.services.embedding_service import GeminiEmbeddingService

class Command(BaseCommand):
    help = "Generate and store Gemini embeddings for products missing vectors"

    def handle(self, *args, **options):
        embedding_service = GeminiEmbeddingService()
        products = Product.objects.filter(embedding__isnull=True)

        self.stdout.write(f"Found {products.count()} products needing embeddings.")

        for product in products:
            text_to_embed = f"{product.name}. {product.description}"
            try:
                vector = embedding_service.generate_embedding(text_to_embed)
                product.embedding = vector
                product.save(update_fields=["embedding"])
                self.stdout.write(self.style.SUCCESS(f"Embedded product: {product.name}"))
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"Failed embedding product {product.id}: {e}"))
```

#### Step 3: Search Query Service (`apps/products/services/vector_search.py`)
```python
from pgvector.django import CosineDistance
from apps.products.models import Product
from apps.products.services.embedding_service import GeminiEmbeddingService

def search_products_by_similarity(query_text: str, top_k: int = 6):
    """
    Given a user natural language query (e.g. 'warm winter outerwear'),
    generate query embedding and return nearest product catalog items.
    """
    service = GeminiEmbeddingService()
    query_vector = service.generate_embedding(query_text)

    results = (
        Product.objects.exclude(embedding__isnull=True)
        .annotate(distance=CosineDistance("embedding", query_vector))
        .order_by("distance")[:top_k]
    )
    return results
```

---

## 7. Summary & Recommendations for StyleSense AI

1. **Database Base Image**: Update `compose.yml` to use `pgvector/pgvector:pg16` for seamless local Docker development.
2. **PyPI Dependency**: Add `pgvector` to project dependencies (`uv add pgvector`).
3. **Django Models**: Declare `VectorField(dimensions=768)` on `Product` model, accompanied by `HnswIndex(opclasses=['vector_cosine_ops'])` for high-performance vector search.
4. **Google GenAI SDK**: Utilize `google-genai` with model `text-embedding-004` (768 dimensions), utilizing `client.aio.models.embed_content` when working in async Django views or background workers.
