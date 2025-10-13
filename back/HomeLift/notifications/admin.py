from django.contrib import admin
from .models import Notification

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'type',
        'title',
        'recipient',
        'sender',
        'is_read',
        'created_at',
    )
    list_filter = ('type', 'is_read', 'created_at')
    search_fields = (
        'title',
        'message',
        'recipient__email',
        'sender__email',
    )
    readonly_fields = (
        'recipient',
        'created_at',
        'object_id',
    )
    ordering = ('-created_at',)
    list_per_page = 25

    # Optional: customize how recipient and sender appear
    def recipient(self, obj):
        return obj.recipient.email if obj.recipient else "—"

    def sender(self, obj):
        return obj.sender.email if obj.sender else "System"
