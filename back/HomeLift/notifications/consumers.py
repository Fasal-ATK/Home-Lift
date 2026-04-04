import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model

User = get_user_model()

class MainConsumer(AsyncWebsocketConsumer):
    """
    Unified WebSocket consumer for handling notifications and real-time chat messages.
    Everything is routed through the 'user_<id>' group.
    """
    async def connect(self):
        try:
            self.user = self.scope.get('user')
            if not self.user or self.user.is_anonymous:
                print("WebSocket Connect Reject: No authenticated user")
                await self.close()
                return

            self.user_id = self.user.id
            self.group_name = f"user_{self.user_id}"
            
            # Accept the connection
            await self.accept()
            print(f"Main WebSocket: Connected user {self.user_id}")

            # Join room group
            if self.channel_layer:
                await self.channel_layer.group_add(
                    self.group_name,
                    self.channel_name
                )
            else:
                print("WebSocket Connect Error: Channel layer not configured!")

        except Exception as e:
            print(f"WebSocket Connect Error: {e}")
            await self.close()

    async def disconnect(self, close_code):
        print(f"Main WebSocket: Disconnected for user {getattr(self, 'user_id', 'unknown')} (code: {close_code})")
        # Leave room group
        if hasattr(self, 'group_name') and self.channel_layer:
            await self.channel_layer.group_discard(
                self.group_name,
                self.channel_name
            )

    # Triggered by self.channel_layer.group_send(group_name, {"type": "send_notification", ...})
    async def send_notification(self, event):
        message = event.get('message')
        notification_type = event.get('notification_type', 'system')

        # Send formatted event to WebSocket
        await self.send(text_data=json.dumps({
            'type': 'notification',
            'message': message,
            'notification_type': notification_type,
            'payload': event.get('payload', {})
        }))

    # Triggered by self.channel_layer.group_send(group_name, {"type": "chat_message", ...})
    async def chat_message(self, event):
        # We assume event['payload'] contains message data (id, room_id, sender_id, content, etc.)
        await self.send(text_data=json.dumps({
            'type': 'chat_message',
            'payload': event.get('payload', {})
        }))

    # Triggered by self.channel_layer.group_send(group_name, {"type": "read_receipt", ...})
    async def read_receipt(self, event):
        await self.send(text_data=json.dumps({
            'type': 'read_receipt',
            'payload': event.get('payload', {})
        }))

    async def receive(self, text_data):
        """
        Handle incoming messages from the client if needed (e.g. sending a chat message).
        For now, we trust the client can send via REST API and we broadcast here.
        """
        try:
            data = json.loads(text_data)
            msg_type = data.get('type')

            if msg_type == 'chat_message':
                # Process outgoing chat message if implemented via socket instead of REST
                room_id = data.get('room_id')
                content = data.get('content')
                if room_id and content:
                    await self.handle_outbound_chat(room_id, content)

        except Exception as e:
            print(f"WebSocket Receive Error: {e}")

    async def handle_outbound_chat(self, room_id, content):
        # Save to DB and broadcast to participants
        # (This is better handled via REST for consistency, but socket works too)
        from chat.models import ChatRoom, ChatMessage
        
        room = await self.get_room(room_id)
        if room:
            msg = await self.save_message(room, content)
            payload = {
                'id': msg.id,
                'room_id': room.id,
                'sender_id': self.user.id,
                'content': msg.content,
                'created_at': msg.created_at.isoformat()
            }
            
            # Broadcast to both participants
            participants = [room.user_id, room.provider_id]
            for pid in participants:
                await self.channel_layer.group_send(
                    f"user_{pid}",
                    {
                        "type": "chat_message",
                        "payload": payload
                    }
                )

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
