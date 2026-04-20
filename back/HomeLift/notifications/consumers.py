import json
import logging
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model

User = get_user_model()
logger = logging.getLogger(__name__)


class MainConsumer(AsyncWebsocketConsumer):
    """
    Unified WebSocket consumer for notifications and real-time chat messages.
    Everything is routed through the 'user_<id>' personal group.
    """

    async def connect(self):
        try:
            self.user = self.scope.get('user')
            if not self.user or self.user.is_anonymous:
                logger.warning("MainConsumer: Rejected unauthenticated WebSocket connection")
                await self.close()
                return

            self.user_id = self.user.id
            self.group_name = f"user_{self.user_id}"

            await self.accept()
            logger.info("MainConsumer: Connected user %s", self.user_id)

            if self.channel_layer:
                await self.channel_layer.group_add(self.group_name, self.channel_name)
            else:
                logger.error("MainConsumer: Channel layer not configured!")

        except Exception as e:
            logger.exception("MainConsumer.connect error: %s", e)
            await self.close()

    async def disconnect(self, close_code):
        logger.info("MainConsumer: Disconnected user %s (code %s)",
                    getattr(self, 'user_id', 'unknown'), close_code)
        if hasattr(self, 'group_name') and self.channel_layer:
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    # ─── Channel event handlers ───────────────────────────────────────────────

    async def send_notification(self, event):
        """Handles: channel_layer.group_send(..., {'type': 'send_notification', ...})"""
        await self.send(text_data=json.dumps({
            'type': 'notification',
            'message': event.get('message'),
            'notification_type': event.get('notification_type', 'system'),
            'payload': event.get('payload', {}),
        }))

    async def chat_message(self, event):
        """Handles: channel_layer.group_send(..., {'type': 'chat_message', ...})"""
        await self.send(text_data=json.dumps({
            'type': 'chat_message',
            'payload': event.get('payload', {}),
        }))

    async def read_receipt(self, event):
        """Handles: channel_layer.group_send(..., {'type': 'read_receipt', ...})"""
        await self.send(text_data=json.dumps({
            'type': 'read_receipt',
            'payload': event.get('payload', {}),
        }))

    # ─── Incoming from client ─────────────────────────────────────────────────

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
        except json.JSONDecodeError:
            logger.warning("MainConsumer: Invalid JSON from user %s", getattr(self, 'user_id', '?'))
            return

        msg_type = data.get('type')

        if msg_type == 'chat_message':
            room_id = data.get('room_id')
            content = data.get('content', '').strip()
            if room_id and content:
                await self.handle_outbound_chat(room_id, content)

    async def handle_outbound_chat(self, room_id, content):
        """Save message to DB and broadcast to both participants."""
        try:
            room = await self.get_room(room_id)
            if not room:
                logger.warning("MainConsumer: Room %s not found for user %s", room_id, self.user_id)
                return

            msg = await self.save_message(room, content)
            payload = {
                'id': msg.id,
                'room_id': room.id,
                'sender_id': self.user.id,
                'sender_name': self.user.get_full_name() or self.user.username,
                'content': msg.content,
                'created_at': msg.created_at.isoformat(),
                'is_read': False,
            }

            for pid in [room.user_id, room.provider_id]:
                await self.channel_layer.group_send(
                    f"user_{pid}",
                    {"type": "chat_message", "payload": payload}
                )
        except Exception as e:
            logger.exception("MainConsumer.handle_outbound_chat failed for room %s user %s: %s",
                             room_id, self.user_id, e)

    # ─── DB helpers ───────────────────────────────────────────────────────────

    @database_sync_to_async
    def get_room(self, room_id):
        from chat.models import ChatRoom
        try:
            return ChatRoom.objects.get(id=room_id)
        except ChatRoom.DoesNotExist:
            return None

    @database_sync_to_async
    def save_message(self, room, content):
        from chat.models import ChatMessage
        return ChatMessage.objects.create(room=room, sender=self.user, content=content)
