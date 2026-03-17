import cloudinary.models
import core.validators
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('providers', '0013_providerservicerequest'),
    ]

    operations = [
        migrations.AddField(
            model_name='providerservicerequest',
            name='doc',
            field=cloudinary.models.CloudinaryField(blank=True, help_text='Optional service verification document (max 10 MB)', max_length=255, null=True, validators=[core.validators.validate_document_size], verbose_name='raw'),
        ),
    ]
