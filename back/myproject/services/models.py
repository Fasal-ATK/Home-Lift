from django.db import models
from cloudinary.models import CloudinaryField


class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    icon = CloudinaryField(
        'image',
        folder='icons/categories',
        blank=True,
        null=True,
        help_text="Image or icon for this category"
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class Service(models.Model):
    name = models.CharField(max_length=100)
    category = models.ForeignKey(
        Category,
        on_delete=models.CASCADE,
        related_name='services'
    )
    description = models.TextField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    duration = models.PositiveIntegerField(help_text="Duration in minutes")

    icon = CloudinaryField(
        'image',
        folder='icons/services',
        blank=True,
        null=True,
        help_text="Image or icon for this service"
    )

    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name
