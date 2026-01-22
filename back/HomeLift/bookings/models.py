from django.db import models
from django.conf import settings
from decimal import Decimal
from services.models import Service
from core.models import Address  # ✅ Import Address from core app


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

    # ✅ Instead of plain text, use ForeignKey to Address
    address = models.ForeignKey(
        Address,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="bookings",
        help_text="User’s saved address used for this booking"
    )

    full_name = models.CharField(max_length=100)
    phone = models.CharField(max_length=15)
    notes = models.TextField(blank=True, null=True)

    # 🗓️ Appointment details
    booking_date = models.DateField(help_text="Date when the service is scheduled")
    booking_time = models.TimeField(help_text="Time when the service should start")

    # 💰 Price fields
    price = models.DecimalField(max_digits=10, decimal_places=2, help_text="Base service price")
    advance = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0.00,
        help_text="Advance amount (2% of price, capped at ₹200)"
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="pending"
    )

    is_advance_paid = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        """Automatically calculate advance before saving."""
        if self.price:
            calculated_advance = self.price * Decimal('0.02')
            capped_advance = min(calculated_advance, Decimal('200.00'))
            # Stripe minimum is ₹50
            self.advance = max(capped_advance, Decimal('50.00'))
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Booking #{self.id} - {self.service.name} ({self.status})"

    class Meta:
        ordering = ['-created_at']
