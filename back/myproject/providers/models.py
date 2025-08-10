from django.db import models
from django.conf import settings
from services.models import Service
from django.core.exceptions import ValidationError
from cloudinary.models import CloudinaryField



class ProviderDetails(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('cancelled', 'Cancelled'),
    ]

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='provider_details',
        limit_choices_to={'is_provider': True},
    )

    profile_picture = CloudinaryField(
        'image',
        blank=True,
        null=True,
        help_text="Profile picture stored in Cloudinary"
    )

    document = CloudinaryField(
        'raw',  # Use 'raw' for documents like PDFs
        blank=True,
        null=True,
        help_text="Document stored in Cloudinary"
    )

    status = models.CharField(
        max_length=10,
        choices=STATUS_CHOICES,
        default='pending'
    )

    rejection_reason = models.TextField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = "Provider Detail"
        verbose_name_plural = "Provider Details"

    def __str__(self):
        return f"{self.user.username} - {self.status}"

    def clean(self):
        if self.status != 'rejected' and self.rejection_reason:
            raise ValidationError("Rejection reason can only be set if the status is 'rejected'.")
        if self.status == 'rejected' and not self.rejection_reason:
            raise ValidationError("Rejection reason is required when status is 'rejected'.")


class ProviderService(models.Model):
    provider = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='provided_services',
        limit_choices_to={'is_provider': True}
    )
    service = models.ForeignKey(
        Service,
        on_delete=models.CASCADE,
        related_name='provider_services'
    )
    price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        blank=True,
        null=True,
        help_text="If left blank, defaults to service price"
    )
    experience_years = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('provider', 'service')
        verbose_name = "Provider Service"
        verbose_name_plural = "Provider Services"

    def __str__(self):
        return f"{self.provider.username} - {self.service.name}"

    @property
    def effective_price(self):
        return self.price if self.price is not None else self.service.price
