import logging

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

from django.db.models import Max, Q
from django.db.models.functions import Coalesce

from .models import ChatRoom, ChatMessage
from .serializers import ChatRoomSerializer, ChatMessageSerializer
from bookings.models import Booking

logger = logging.getLogger(__name__)


class ChatRoomListView(APIView):
    """
    GET  /chat/rooms/   → list all rooms for the current user (inbox)
    POST /chat/rooms/   → create or retrieve a chat room with a provider
                          body: { provider_id, booking_id (optional) }
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            rooms = (
                ChatRoom.objects.filter(Q(user=request.user) | Q(provider=request.user))
                .distinct()
                .annotate(latest_activity=Coalesce(Max('messages__created_at'), 'created_at'))
                .order_by('-latest_activity')
                .prefetch_related('messages')
            )
            serializer = ChatRoomSerializer(rooms, many=True, context={'request': request})
            return Response(serializer.data)
        except Exception as e:
            logger.exception("ChatRoomListView.get failed for user %s: %s", request.user.id, e)
            return Response(
                {'detail': 'Failed to fetch chat rooms. Please try again.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def post(self, request):
        """Create or get a chat room between the requesting user/admin and a provider/user."""
        try:
            other_user_id = (
                request.data.get('other_user_id') or
                request.data.get('provider_id') or 
                request.data.get('user_id') or 
                request.data.get('target_user_id') or 
                request.data.get('recipient_id')
            )
            booking_id = request.data.get('booking_id')

            if not other_user_id:
                return Response(
                    {'detail': 'Recipient user ID is required to start or open a chat room.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            from django.contrib.auth import get_user_model
            User = get_user_model()
            try:
                other_user = User.objects.get(id=other_user_id)
            except User.DoesNotExist:
                return Response(
                    {'detail': 'The specified user could not be found.'},
                    status=status.HTTP_404_NOT_FOUND
                )

            booking = None
            if booking_id:
                try:
                    booking = Booking.objects.get(id=booking_id)
                except Booking.DoesNotExist:
                    logger.warning("ChatRoomListView.post: booking %s not found (non-fatal)", booking_id)

            is_requester_admin = bool(getattr(request.user, 'is_staff', False) or getattr(request.user, 'is_superuser', False))

            # Determine who is user vs provider
            if booking:
                user_in_room = booking.user
                provider_in_room = booking.provider
            elif is_requester_admin:
                if getattr(other_user, 'is_provider', False):
                    user_in_room = request.user
                    provider_in_room = other_user
                else:
                    user_in_room = other_user
                    provider_in_room = request.user
            else:
                if getattr(request.user, 'is_provider', False):
                    user_in_room = other_user
                    provider_in_room = request.user
                else:
                    user_in_room = request.user
                    provider_in_room = other_user

            if provider_in_room is None:
                return Response(
                    {'detail': 'Cannot start a chat room: A service provider or recipient has not been assigned.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            from django.db.models import Q
            room = ChatRoom.objects.filter(
                (Q(user=user_in_room) & Q(provider=provider_in_room)) |
                (Q(user=provider_in_room) & Q(provider=user_in_room))
            ).first()

            created = False
            if room:
                if booking and not room.booking:
                    room.booking = booking
                    room.save()
            else:
                room = ChatRoom.objects.create(
                    user=user_in_room,
                    provider=provider_in_room,
                    booking=booking
                )
                created = True

            serializer = ChatRoomSerializer(room, context={'request': request})
            return Response(
                serializer.data,
                status=status.HTTP_201_CREATED if created else status.HTTP_200_OK
            )
        except Exception as e:
            logger.exception("ChatRoomListView.post failed for user %s: %s", request.user.id, e)
            return Response(
                {'detail': 'Failed to create chat room. Please try again.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ChatMessageListView(APIView):
    """
    GET  /chat/rooms/<room_id>/messages/  → get message history & mark as read
    POST /chat/rooms/<room_id>/messages/  → send a message (REST fallback)
    """
    permission_classes = [IsAuthenticated]

    def _get_room_or_403(self, room_id, user):
        """Returns (room, error_response). Only one is non-None."""
        try:
            room = ChatRoom.objects.get(id=room_id)
        except ChatRoom.DoesNotExist:
            return None, Response({'detail': 'The requested chat room does not exist.'}, status=status.HTTP_404_NOT_FOUND)
        is_staff = bool(getattr(user, 'is_staff', False) or getattr(user, 'is_superuser', False))
        if room.user != user and room.provider != user and not is_staff:
            return None, Response({'detail': 'You do not have permission to access or send messages in this chat room.'}, status=status.HTTP_403_FORBIDDEN)
        return room, None

    def get(self, request, room_id):
        try:
            room, err = self._get_room_or_403(room_id, request.user)
            if err:
                return err

            # Mark messages from the other participant as read
            updated = room.messages.filter(
                is_read=False
            ).exclude(sender=request.user).update(is_read=True)

            # Broadcast read receipt to the other participant so their UI updates
            if updated:
                other_user = room.provider if room.user == request.user else room.user
                self._broadcast_read_receipt(room.id, request.user.id, other_user.id)

            messages = room.messages.select_related('sender').all()
            serializer = ChatMessageSerializer(messages, many=True)
            return Response(serializer.data)

        except Exception as e:
            logger.exception("ChatMessageListView.get failed for room %s, user %s: %s",
                             room_id, request.user.id, e)
            return Response(
                {'detail': 'Failed to load messages. Please try again.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def post(self, request, room_id):
        try:
            room, err = self._get_room_or_403(room_id, request.user)
            if err:
                return err

            content = (request.data.get('content') or '').strip()
            if not content:
                return Response({'detail': 'Message content cannot be empty.'}, status=status.HTTP_400_BAD_REQUEST)

            message = ChatMessage.objects.create(room=room, sender=request.user, content=content)
            serializer = ChatMessageSerializer(message)

            is_admin = bool(getattr(request.user, 'is_staff', False) or getattr(request.user, 'is_superuser', False))
            # Broadcast message via Channels to both participants
            payload = {
                'id': message.id,
                'room_id': room.id,
                'sender_id': request.user.id,
                'sender_name': (f"Admin ({request.user.get_full_name() or request.user.username})" if is_admin else (request.user.get_full_name() or request.user.username)),
                'content': message.content,
                'created_at': message.created_at.isoformat(),
                'is_read': False,
                'is_sender_admin': is_admin,
            }
            self._broadcast_chat_message(room, payload)

            return Response(serializer.data, status=status.HTTP_201_CREATED)

        except Exception as e:
            logger.exception("ChatMessageListView.post failed for room %s, user %s: %s",
                             room_id, request.user.id, e)
            return Response(
                {'detail': 'Failed to send message. Please try again.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    # ─── private broadcast helpers ───────────────────────────────────────────

    @staticmethod
    def _broadcast_chat_message(room, payload):
        try:
            from channels.layers import get_channel_layer
            from asgiref.sync import async_to_sync
            channel_layer = get_channel_layer()
            msg_id = payload.get('id', '?')
            room_id = payload.get('room_id', '?')
            for pid in [room.user_id, room.provider_id]:
                group_name = f"user_{pid}"
                msg1 = (
                    f"⚡ [REST BROADCAST] Sending chat message "
                    f"message_id={msg_id} room_id={room_id} to={group_name}"
                )
                logger.info(msg1)
                print(msg1, flush=True)

                async_to_sync(channel_layer.group_send)(
                    group_name,
                    {"type": "chat_message", "payload": payload}
                )

                msg2 = (
                    f"⚡ [REST BROADCAST] group_send completed successfully "
                    f"message_id={msg_id} to={group_name}"
                )
                logger.info(msg2)
                print(msg2, flush=True)
        except Exception as e:
            logger.warning("Failed to broadcast chat message for room %s: %s", room.id, e)

    @staticmethod
    def _broadcast_read_receipt(room_id, reader_id, other_user_id):
        try:
            from channels.layers import get_channel_layer
            from asgiref.sync import async_to_sync
            channel_layer = get_channel_layer()
            async_to_sync(channel_layer.group_send)(
                f"user_{other_user_id}",
                {
                    "type": "read_receipt",
                    "payload": {
                        "room_id": room_id,
                        "reader_id": reader_id,
                    }
                }
            )
        except Exception as e:
            logger.warning("Failed to broadcast read receipt for room %s: %s", room_id, e)

