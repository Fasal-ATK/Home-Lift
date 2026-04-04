from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from .models import ChatRoom, ChatMessage
from .serializers import ChatRoomSerializer, ChatMessageSerializer
from bookings.models import Booking


class ChatRoomListView(APIView):
    """
    GET  /chat/rooms/        → list all rooms for the current user (inbox)
    POST /chat/rooms/        → create or retrieve a chat room with a provider
                               body: { provider_id, booking_id (optional) }
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Return all rooms where current user is either the user or provider
        rooms = ChatRoom.objects.filter(
            user=request.user
        ) | ChatRoom.objects.filter(
            provider=request.user
        )
        rooms = rooms.distinct().order_by('-created_at')
        # Prefetch messages for performance
        rooms = rooms.prefetch_related('messages')
        serializer = ChatRoomSerializer(rooms, many=True, context={'request': request})
        return Response(serializer.data)

    def post(self, request):
        """Create or get a chat room between the requesting user and a provider."""
        other_user_id = request.data.get('provider_id')  # the other party
        booking_id = request.data.get('booking_id', None)

        if not other_user_id:
            return Response({'detail': 'provider_id is required.'}, status=status.HTTP_400_BAD_REQUEST)

        from django.contrib.auth import get_user_model
        User = get_user_model()
        try:
            other_user = User.objects.get(id=other_user_id)
        except User.DoesNotExist:
            return Response({'detail': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

        booking = None
        if booking_id:
            try:
                booking = Booking.objects.get(id=booking_id)
            except Booking.DoesNotExist:
                pass

        # Determine who is user vs provider
        if booking:
            user_in_room = booking.user
            provider_in_room = booking.provider
        else:
            # Fallback if no booking provided
            if getattr(request.user, 'is_provider', False):
                user_in_room = other_user
                provider_in_room = request.user
            else:
                user_in_room = request.user
                provider_in_room = other_user

        room, created = ChatRoom.objects.get_or_create(
            user=user_in_room,
            provider=provider_in_room,
            defaults={'booking': booking}
        )
        serializer = ChatRoomSerializer(room, context={'request': request})
        return Response(serializer.data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)


class ChatMessageListView(APIView):
    """
    GET /chat/rooms/<room_id>/messages/ → get message history for a room
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, room_id):
        try:
            room = ChatRoom.objects.get(id=room_id)
        except ChatRoom.DoesNotExist:
            return Response({'detail': 'Room not found.'}, status=status.HTTP_404_NOT_FOUND)

        # Only room participants can read messages
        if room.user != request.user and room.provider != request.user:
            return Response({'detail': 'Not authorized.'}, status=status.HTTP_403_FORBIDDEN)

        # Mark messages from the other user as read
        room.messages.filter(is_read=False).exclude(sender=request.user).update(is_read=True)

        # Broadcast read receipt to other participant
        other_user = room.provider if room.user == request.user else room.user
        from channels.layers import get_channel_layer
        from asgiref.sync import async_to_sync
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f"user_{other_user.id}",
            {
                "type": "read_receipt",
                "payload": {
                    "room_id": room.id,
                    "reader_id": request.user.id
                }
            }
        )

        messages = room.messages.select_related('sender').all()
        serializer = ChatMessageSerializer(messages, many=True)
        return Response(serializer.data)

    def post(self, request, room_id):
        try:
            room = ChatRoom.objects.get(id=room_id)
        except ChatRoom.DoesNotExist:
            return Response({'detail': 'Room not found.'}, status=status.HTTP_404_NOT_FOUND)

        if room.user != request.user and room.provider != request.user:
            return Response({'detail': 'Not authorized.'}, status=status.HTTP_403_FORBIDDEN)

        content = request.data.get('content')
        if not content:
            return Response({'detail': 'Content is required.'}, status=status.HTTP_400_BAD_REQUEST)

        message = ChatMessage.objects.create(room=room, sender=request.user, content=content)
        serializer = ChatMessageSerializer(message)

        # Broadcast message via Channels
        from channels.layers import get_channel_layer
        from asgiref.sync import async_to_sync
        channel_layer = get_channel_layer()

        payload = {
            'id': message.id,
            'room_id': room.id,
            'sender_id': request.user.id,
            'sender_name': request.user.get_full_name() or request.user.username,
            'content': message.content,
            'created_at': message.created_at.isoformat(),
        }

        participants = [room.user_id, room.provider_id]
        for pid in participants:
            async_to_sync(channel_layer.group_send)(
                f"user_{pid}",
                {
                    "type": "chat_message",
                    "payload": payload
                }
            )

        return Response(serializer.data, status=status.HTTP_201_CREATED)
