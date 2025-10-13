from django.db import models
from django.conf import settings
from django.contrib.contenttypes.models import ContentType
from django.contrib.contenttypes.fields import GenericForeignKey


class Notification(models.Model):
    NOTIFICATION_TYPES = [
        ('booking', 'Booking'),
        ('provider', 'Provider'),
        ('payment', 'Payment'),
        ('chat', 'Chat'),
        ('system', 'System'),
    ]

    # who receives this
    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notifications'
    )
    # who triggered it (user/admin/system)
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True, blank=True,
        on_delete=models.SET_NULL,
        related_name='sent_notifications'
    )
    # optional link to related object (e.g., Booking, Payment, etc.)
    content_type = models.ForeignKey(
        ContentType, on_delete=models.CASCADE, null=True, blank=True
    )
    object_id = models.PositiveIntegerField(null=True, blank=True)
    content_object = GenericForeignKey('content_type', 'object_id')

    title = models.CharField(max_length=255, null=True, blank=True)
    type = models.CharField(max_length=20, choices=NOTIFICATION_TYPES)
    message = models.TextField()

    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"[{self.type.upper()}] → {self.recipient.email}: {self.message[:40]}"
