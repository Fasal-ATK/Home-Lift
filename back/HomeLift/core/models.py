# models.py
from django.db import models
from django.conf import settings

class Address(models.Model):
    user = models.ForeignKey( settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="addresses")
    title = models.CharField(max_length=50, default="Home")
    address_line = models.CharField(max_length=255)
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    postal_code = models.CharField(max_length=20)
    country = models.CharField(max_length=100, default="India")
    
    # 🔥 Location fields
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)

    # Optional fields for UX improvements
    is_default = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} - {self.city}"

    class Meta:
        verbose_name_plural = "Addresses"
        ordering = ["-created_at"]


class Ticket(models.Model):
    TICKET_TYPES = (
        ('feature', 'Feature Request'),
        ('service', 'Service Report'),
        ('provider', 'Provider Issue'),
        ('general', 'General / Other'),
    )
    STATUS_CHOICES = (
        ('open', 'Open'),
        ('resolved', 'Resolved'),
        ('closed', 'Closed'),
    )

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='tickets')
    subject = models.CharField(max_length=255)
    description = models.TextField()
    ticket_type = models.CharField(max_length=50, choices=TICKET_TYPES, default='general')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='open')
    admin_reply = models.TextField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"[{self.status.upper()}] {self.subject} by {self.user.username}"
