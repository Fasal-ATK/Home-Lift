import json
import logging
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from .models import ChatRoom, ChatMessage

User = get_user_model()
logger = logging.getLogger(__name__)


class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_id = self.scope['url_route']['kwargs']['room_id']
        self.room_group_name = f'chat_{self.room_id}'

        # Validate user authentication via scope (JWT token passed as query param)
        self.user = self.scope.get('user')
        if not self.user or not self.user.is_authenticated:
            logger.warning("ChatConsumer: Unauthenticated connection attempt for room %s", self.room_id)
            await self.close()
            return

        # Check if user belongs to this room
        room = await self.get_room(self.room_id)
        if not room:
            logger.warning("ChatConsumer: Room %s not found for user %s", self.room_id, self.user.id)
            await self.close()
            return

        if not (room.user == self.user or room.provider == self.user):
            logger.warning("ChatConsumer: User %s not a participant of room %s", self.user.id, self.room_id)
            await self.close()
            return

        self.room = room

        # Join room group
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()
        logger.info("ChatConsumer: User %s connected to room %s", self.user.id, self.room_id)

        # Mark unread messages as read and broadcast receipt to the other participant
        count = await self.mark_messages_read()
        if count:
            await self._broadcast_read_receipt()

    async def disconnect(self, close_code):
        logger.info("ChatConsumer: User %s disconnected from room %s (code %s)",
                    getattr(self, 'user', {id: 'unknown'} if not hasattr(self, 'user') else self.user).id
                    if hasattr(self, 'user') else 'unknown', self.room_id, close_code)
        if hasattr(self, 'room_group_name'):
            await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
        except json.JSONDecodeError:
            logger.warning("ChatConsumer: Invalid JSON from user %s in room %s",
                           getattr(self, 'user', None) and self.user.id, self.room_id)
            return

        msg_type = data.get('type')

        # ---------- outgoing chat message ----------
        if msg_type == 'chat_message' or 'message' in data:
            content = data.get('message') or data.get('content', '')
            content = content.strip()
            if not content:
                return

            # Save message to DB
            message = await self.save_message(content)

            # Broadcast to room group (both participants)
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'chat_message',
                    'message': {
                        'id': message.id,
                        'room_id': self.room.id,
                        'sender_id': self.user.id,
                        'sender_name': self.user.get_full_name() or self.user.username,
                        'content': message.content,
                        'created_at': message.created_at.isoformat(),
                        'is_read': False,
                    }
                }
            )

        # ---------- read receipt (client signals they read messages) ----------
        elif msg_type == 'read':
            count = await self.mark_messages_read()
            if count:
                await self._broadcast_read_receipt()

    async def chat_message(self, event):
        """Forwards a chat_message channel event to the WebSocket client."""
        await self.send(text_data=json.dumps({
            'type': 'chat_message',
            **event['message']
        }))

    async def read_receipt(self, event):
        """Forwards a read_receipt channel event to the WebSocket client."""
        await self.send(text_data=json.dumps({
            'type': 'read_receipt',
            'payload': event.get('payload', {})
        }))

    # ─── helpers ────────────────────────────────────────────────────────────────

    async def _broadcast_read_receipt(self):
        """
        Notify the other participant (via their personal group) that the current
        user has read the messages in this room.
        """
        other_user_id = (
            self.room.provider_id if self.room.user == self.user else self.room.user_id
        )
        await self.channel_layer.group_send(
            f"user_{other_user_id}",
            {
                "type": "read_receipt",
                "payload": {
                    "room_id": self.room.id,
                    "reader_id": self.user.id,
                }
            }
        )

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
        """Mark all unread messages not sent by this user as read. Returns count updated."""
        return self.room.messages.filter(
            is_read=False
        ).exclude(sender=self.user).update(is_read=True)
