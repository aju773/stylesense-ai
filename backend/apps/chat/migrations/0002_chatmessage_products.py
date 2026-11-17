
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('chat', '0001_initial'),
        ('products', '0003_product_embedding_product_product_embedding_hnsw_idx'),
    ]

    operations = [
        migrations.AddField(
            model_name='chatmessage',
            name='products',
            field=models.ManyToManyField(blank=True, help_text='Catalog products this message cites via [[product:id]] markers.', related_name='chat_messages', to='products.product'),
        ),
    ]
