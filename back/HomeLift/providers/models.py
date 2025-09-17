from django.db import models
from django.conf import settings
from services.models import Service
from django.core.exceptions import ValidationError
from cloudinary.models import CloudinaryField
from django.utils import timezone
from datetime import timedelta

# -----------------------------
# Helper function for expiration
# -----------------------------
def default_expiration():
    return timezone.now() + timedelta(weeks=2)


# -----------------------------
# Temporary Provider Application
# -----------------------------
class ProviderApplication(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='provider_applications'
    )
    id_doc = CloudinaryField(
        'ID Document',
        folder='documents/providers',
        resource_type='auto',  # allows PDFs, images, docs
        blank=True,
        null=True,
        help_text="Upload your verification document"
    )
    status = models.CharField(
        max_length=10,
        choices=STATUS_CHOICES,
        default='pending'
    )
    rejection_reason = models.TextField(
        blank=True,
        null=True,
        help_text="Only required if status is 'rejected'"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    replied_at = models.DateTimeField(blank=True, null=True)
    expiration_date = models.DateTimeField(
        default=default_expiration,
        help_text="Temporary applications expire automatically"
    )

    class Meta:
        ordering = ['-created_at']
        verbose_name = "Provider Application"
        verbose_name_plural = "Provider Applications"

    def __str__(self):
        return f"{self.user.username} - {self.status}"

    def clean(self):
        if self.status == 'rejected' and not self.rejection_reason:
            raise ValidationError("Rejection reason is required if the application is rejected.")
        if self.status != 'rejected' and self.rejection_reason:
            raise ValidationError("Rejection reason should only be set if the application is rejected.")


# -----------------------------
# Temporary Services in Application
# -----------------------------
class ProviderApplicationService(models.Model):
    application = models.ForeignKey(
        ProviderApplication,
        on_delete=models.CASCADE,
        related_name='services'
    )
    service = models.ForeignKey(Service, on_delete=models.CASCADE)
    id_doc = CloudinaryField(
        'raw',
        folder='documents/provider_services',
        resource_type='auto',
        blank=True,
        null=True,
        help_text="Optional service verification document"
    )
    price = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    experience_years = models.PositiveIntegerField(default=0)

    class Meta:
        unique_together = ('application', 'service')
        verbose_name = "Provider Application Service"
        verbose_name_plural = "Provider Application Services"

    # <-- make sure this is at the same level as Meta, not inside it
    def save(self, *args, **kwargs):
        if self.price is None:
            self.price = self.service.price
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.application.user.username} - {self.service.name}"

# -----------------------------
# Approved Provider Details
# -----------------------------
class ProviderDetails(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='provider_details',
        limit_choices_to={'is_provider': True},
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    approved_at = models.DateTimeField(blank=True, null=True)
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name='approved_providers',
        help_text="Admin who approved the provider"
    )

    class Meta:
        ordering = ['-created_at']
        verbose_name = "Provider Detail"
        verbose_name_plural = "Provider Details"

    def __str__(self):
        return f"{self.user.username} - Provider Profile"


# -----------------------------
# Approved Provider Services
# -----------------------------
class ProviderService(models.Model):
    provider = models.ForeignKey(
        'ProviderDetails',  
        on_delete=models.CASCADE,
        related_name='services'
    )
    service = models.ForeignKey(
        Service,
        on_delete=models.CASCADE,
        related_name='provider_services'
    )
    doc = CloudinaryField(
        'raw',
        folder='documents/provider_services',
        blank=True,
        null=True,
        help_text="Optional service verification document"
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
        return f"{self.provider.user.username} - {self.service.name}"

    @property
    def effective_price(self):
        return self.price if self.price is not None else self.service.price
