import json
from channels.generic.websocket import AsyncWebsocketConsumer

class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        try:
            self.user_id = self.scope['url_route']['kwargs'].get('user_id')
            if not self.user_id:
                print("WebSocket: No user_id provided in route")
                await self.close()
                return

            self.group_name = f"user_{self.user_id}"
            
            # Accept the connection first
            await self.accept()
            print(f"WebSocket: Accepted connection for user {self.user_id}")

            # Join room group
            if self.channel_layer:
                await self.channel_layer.group_add(
                    self.group_name,
                    self.channel_name
                )
                print(f"WebSocket: Added {self.channel_name} to group {self.group_name}")
            else:
                print("WebSocket: Channel layer not configured!")

        except Exception as e:
            print(f"WebSocket Connect Error: {e}")
            await self.close()


    async def disconnect(self, close_code):
        print(f"WebSocket: Disconnected (code: {close_code})")
        # Leave room group
        if hasattr(self, 'group_name') and self.channel_layer:
            await self.channel_layer.group_discard(
                self.group_name,
                self.channel_name
            )

    # Receive message from room group
    async def send_notification(self, event):
        message = event['message']

        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            'message': message
        }))
