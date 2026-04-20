import logging

from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Notification
from .serializers import NotificationSerializer
from core.pagination import StandardResultsSetPagination

logger = logging.getLogger(__name__)


# 1. List all notifications for the logged-in user
class NotificationListView(generics.ListAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        return Notification.objects.filter(
            recipient=self.request.user
        ).order_by('-created_at')


# 2. Mark a specific notification as read, or DELETE it
class NotificationDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        try:
            notification = Notification.objects.get(pk=pk, recipient=request.user)
        except Notification.DoesNotExist:
            return Response({'detail': 'Notification not found.'}, status=status.HTTP_404_NOT_FOUND)

        action = request.data.get('action', 'read')
        if action not in ('read', 'unread'):
            return Response({'detail': "action must be 'read' or 'unread'."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            notification.is_read = (action == 'read')
            notification.save(update_fields=['is_read'])
            return Response({'detail': f'Notification marked as {action}.'}, status=status.HTTP_200_OK)
        except Exception as e:
            logger.exception("NotificationDetailView.patch failed for pk=%s user=%s: %s",
                             pk, request.user.id, e)
            return Response(
                {'detail': 'Failed to update notification. Please try again.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def delete(self, request, pk):
        try:
            notification = Notification.objects.get(pk=pk, recipient=request.user)
            notification.delete()
            return Response({'detail': 'Notification deleted.'}, status=status.HTTP_204_NO_CONTENT)
        except Notification.DoesNotExist:
            return Response({'detail': 'Notification not found.'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.exception("NotificationDetailView.delete failed for pk=%s user=%s: %s",
                             pk, request.user.id, e)
            return Response(
                {'detail': 'Failed to delete notification. Please try again.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


# 3. Bulk actions (read, unread, delete)
class NotificationBulkActionView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        ids = request.data.get('ids', [])
        action = request.data.get('action')

        if not ids or not action:
            return Response(
                {'detail': 'Both ids and action are required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if action not in ('read', 'unread', 'delete'):
            return Response(
                {'detail': "action must be one of: 'read', 'unread', 'delete'."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            notifications = Notification.objects.filter(id__in=ids, recipient=request.user)

            if action == 'read':
                notifications.update(is_read=True)
            elif action == 'unread':
                notifications.update(is_read=False)
            elif action == 'delete':
                notifications.delete()
                return Response({'detail': 'Notifications deleted.'}, status=status.HTTP_204_NO_CONTENT)

            return Response(
                {'detail': f'Notifications marked as {action}.'},
                status=status.HTTP_200_OK
            )
        except Exception as e:
            logger.exception("NotificationBulkActionView.post failed for user=%s action=%s: %s",
                             request.user.id, action, e)
            return Response(
                {'detail': 'Bulk action failed. Please try again.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
