# users/models.py
from django.db import models
from django.conf import settings
from services.models import Service



class ProviderDetails(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='provider_details',
        limit_choices_to={'is_provider': True},
    )
    document = models.FileField(upload_to='provider_documents/', blank=True, null=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.status}"


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

