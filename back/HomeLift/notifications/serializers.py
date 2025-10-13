from rest_framework import serializers
from .models import Notification

class NotificationSerializer(serializers.ModelSerializer):
    sender_name = serializers.SerializerMethodField()
    recipient_name = serializers.SerializerMethodField()

    class Meta:
        model = Notification
        fields = [
            'id',
            'title',
            'type',
            'message',
            'created_at',
            'sender_name',
            'recipient_name',
            'is_read',
        ]
        read_only_fields = [
            'id',
            'title',
            'type',
            'message',
            'created_at',
            'sender_name',
            'recipient_name',
        ]

    def get_sender_name(self, obj):
        return obj.sender.username if obj.sender else "System"

    def get_recipient_name(self, obj):
        return obj.recipient.username if obj.recipient else None
