import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from .models import ChatRoom, ChatMessage

User = get_user_model()


class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_id = self.scope['url_route']['kwargs']['room_id']
        self.room_group_name = f'chat_{self.room_id}'

        # Validate user authentication via scope (JWT token passed as query param)
        self.user = self.scope.get('user')
        if not self.user or not self.user.is_authenticated:
            await self.close()
            return

        # Check if user belongs to this room
        room = await self.get_room(self.room_id)
        if not room:
            await self.close()
            return

        if not (room.user == self.user or room.provider == self.user):
            await self.close()
            return

        self.room = room

        # Join room group
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

        # Mark unread messages as read when user joins
        await self.mark_messages_read()

    async def disconnect(self, close_code):
        if hasattr(self, 'room_group_name'):
            await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive(self, text_data):
        data = json.loads(text_data)
        content = data.get('message', '').strip()
        if not content:
            return

        # Save message to DB
        message = await self.save_message(content)

        # Broadcast to room group
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'message': {
                    'id': message.id,
                    'sender_id': self.user.id,
                    'sender_name': self.user.get_full_name() or self.user.username,
                    'content': message.content,
                    'created_at': message.created_at.isoformat(),
                    'is_read': False,
                }
            }
        )

    async def chat_message(self, event):
        await self.send(text_data=json.dumps(event['message']))

    @database_sync_to_async
    def get_room(self, room_id):
        try:
            return ChatRoom.objects.select_related('user', 'provider', 'booking__service').get(id=room_id)
        except ChatRoom.DoesNotExist:
            return None

    @database_sync_to_async
    def save_message(self, content):
        return ChatMessage.objects.create(
            room=self.room,
            sender=self.user,
            content=content
        )

    @database_sync_to_async
    def mark_messages_read(self):
        self.room.messages.filter(is_read=False).exclude(sender=self.user).update(is_read=True)
