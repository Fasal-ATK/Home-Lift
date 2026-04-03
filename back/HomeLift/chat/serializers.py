from rest_framework import serializers
from .models import ChatRoom, ChatMessage
from django.conf import settings


class ChatMessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(source='sender.get_full_name', read_only=True)
    sender_username = serializers.CharField(source='sender.username', read_only=True)
    sender_id = serializers.IntegerField(source='sender.id', read_only=True)

    class Meta:
        model = ChatMessage
        fields = ['id', 'sender_id', 'sender_name', 'sender_username', 'content', 'is_read', 'created_at']


class ChatRoomSerializer(serializers.ModelSerializer):
    other_user_name = serializers.SerializerMethodField()
    other_user_id = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()
    booking_id = serializers.IntegerField(source='booking.id', read_only=True, allow_null=True)
    service_name = serializers.CharField(source='booking.service.name', read_only=True, allow_null=True)

    class Meta:
        model = ChatRoom
        fields = ['id', 'other_user_name', 'other_user_id', 'last_message', 'unread_count', 'booking_id', 'service_name', 'created_at']

    def get_other_user_name(self, obj):
        request = self.context.get('request')
        if not request:
            return None
        me = request.user
        other = obj.provider if obj.user == me else obj.user
        return other.get_full_name() or other.username

    def get_other_user_id(self, obj):
        request = self.context.get('request')
        if not request:
            return None
        me = request.user
        other = obj.provider if obj.user == me else obj.user
        return other.id

    def get_last_message(self, obj):
        msg = obj.messages.last()
        if msg:
            return {'content': msg.content, 'created_at': msg.created_at}
        return None

    def get_unread_count(self, obj):
        request = self.context.get('request')
        if not request:
            return 0
        return obj.messages.filter(is_read=False).exclude(sender=request.user).count()
