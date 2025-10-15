from django.db import models
from django.conf import settings
from services.models import Service  # assuming your Service model is in 'services' app


class Booking(models.Model):
    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("confirmed", "Confirmed"),
        ("in_progress", "In Progress"),
        ("completed", "Completed"),
        ("cancelled", "Cancelled"),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name="bookings"
    )

    service = models.ForeignKey(
        Service, 
        on_delete=models.CASCADE, 
        related_name="bookings"
    )

    provider = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_bookings",
        help_text="Service provider assigned to this booking"
    )

    full_name = models.CharField(max_length=100)
    email = models.EmailField()
    phone = models.CharField(max_length=15)

    address = models.TextField(blank=True, null=True)
    appointment_date = models.DateTimeField(blank=True, null=True)

    notes = models.TextField(blank=True, null=True)

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="pending"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Booking #{self.id} - {self.service.name} ({self.status})"

    class Meta:
        ordering = ['-created_at']
