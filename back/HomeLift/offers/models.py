from django.db import models
from cloudinary.models import CloudinaryField

class Offer(models.Model):
    DISCOUNT_TYPE_CHOICES = [
        ('percentage', 'Percentage'),
        ('fixed', 'Fixed Amount'),
    ]

    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    discount_type = models.CharField(max_length=20, choices=DISCOUNT_TYPE_CHOICES, default='percentage')
    discount_value = models.DecimalField(max_digits=10, decimal_places=2)
    max_discount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, help_text="Maximum discount amount (useful for percentage discounts)")
    
    # Targeting
    category = models.ForeignKey('services.Category', on_delete=models.SET_NULL, null=True, blank=True, related_name='offers')
    service = models.ForeignKey('services.Service', on_delete=models.SET_NULL, null=True, blank=True, related_name='offers')

    start_date = models.DateField()
    end_date = models.DateField()
    is_active = models.BooleanField(default=True)
    image = CloudinaryField('image', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title

    class Meta:
        ordering = ['-created_at']
