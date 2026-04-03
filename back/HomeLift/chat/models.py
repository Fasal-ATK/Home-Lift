from django.db import models
from django.conf import settings


class ChatRoom(models.Model):
    """
    A unique chat room between a user and a provider, optionally linked to a booking.
    """
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='chat_rooms_as_user'
    )
    provider = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='chat_rooms_as_provider'
    )
    booking = models.ForeignKey(
        'bookings.Booking',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='chat_rooms'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        # A user and provider pair should only have one chat room per booking (or one global)
        unique_together = ('user', 'provider', 'booking')
        ordering = ['-created_at']

    def __str__(self):
        return f"Chat: {self.user.username} ↔ {self.provider.username}"


class ChatMessage(models.Model):
    room = models.ForeignKey(ChatRoom, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='sent_messages'
    )
    content = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"{self.sender.username}: {self.content[:40]}"
