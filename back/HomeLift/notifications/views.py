from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Notification
from .serializers import NotificationSerializer

from core.pagination import StandardResultsSetPagination

# ✅ 1. List all notifications for the logged-in user
class NotificationListView(generics.ListAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        user = self.request.user
        return Notification.objects.filter(recipient=user).order_by('-created_at')


# ✅ 2. Mark a specific notification as read, unread or DELETE it
class NotificationDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        action = request.data.get('action', 'read')
        try:
            notification = Notification.objects.get(pk=pk, recipient=request.user)
        except Notification.DoesNotExist:
            return Response({'detail': 'Notification not found.'}, status=status.HTTP_404_NOT_FOUND)

        if action == 'read':
            notification.is_read = True
        
        notification.save()
        return Response({'detail': f'Notification marked as {action}.'}, status=status.HTTP_200_OK)

    def delete(self, request, pk):
        try:
            notification = Notification.objects.get(pk=pk, recipient=request.user)
            notification.delete()
            return Response({'detail': 'Notification deleted.'}, status=status.HTTP_204_NO_CONTENT)
        except Notification.DoesNotExist:
            return Response({'detail': 'Notification not found.'}, status=status.HTTP_404_NOT_FOUND)


# ✅ 3. Bulk actions (read, unread, delete)
class NotificationBulkActionView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        ids = request.data.get('ids', [])
        action = request.data.get('action')

        if not ids or not action:
            return Response({'detail': 'IDs and action are required.'}, status=status.HTTP_400_BAD_REQUEST)

        notifications = Notification.objects.filter(id__in=ids, recipient=request.user)

        if action == 'read':
            notifications.update(is_read=True)
        elif action == 'delete':
            notifications.delete()
            return Response({'detail': 'Notifications deleted.'}, status=status.HTTP_204_NO_CONTENT)
        else:
            return Response({'detail': 'Invalid action.'}, status=status.HTTP_400_BAD_REQUEST)

        return Response({'detail': f'Notifications marked as {action}.'}, status=status.HTTP_200_OK)
