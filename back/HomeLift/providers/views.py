from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from .models import ProviderApplication
from .serializers import ProviderApplicationSerializer
from core.permissions import IsNormalUser, IsAdminUserCustom
import logging

logger = logging.getLogger(__name__)

# ------------------------------
# Submit Provider Application
# ------------------------------
class ProviderApplicationCreateAPIView(APIView):
    permission_classes = [IsNormalUser]

    def post(self, request, *args, **kwargs):
        logger.debug(f"Received data: {request.data}")
        serializer = ProviderApplicationSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ------------------------------
# List Current User Applications
# ------------------------------
class ProviderApplicationListAPIView(APIView):
    permission_classes = [IsAdminUserCustom]

    def get(self, request, *args, **kwargs):
        applications = ProviderApplication.objects.filter(user=request.user)
        serializer = ProviderApplicationSerializer(applications, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


# ------------------------------
# Admin: Approve/Reject Application
# ------------------------------
class ProviderApplicationUpdateStatusAPIView(APIView):
    permission_classes = [IsAdminUserCustom]

    def patch(self, request, id, *args, **kwargs):
        try:
            application = ProviderApplication.objects.get(id=id)
        except ProviderApplication.DoesNotExist:
            return Response({'detail': 'Application not found'}, status=status.HTTP_404_NOT_FOUND)

        status_value = request.data.get('status')
        rejection_reason = request.data.get('rejection_reason', '')

        if status_value not in ['approved', 'rejected']:
            return Response({'detail': 'Invalid status'}, status=status.HTTP_400_BAD_REQUEST)

        application.status = status_value
        application.rejection_reason = rejection_reason if status_value == 'rejected' else ''
        application.replied_at = timezone.now()
        application.save()

        serializer = ProviderApplicationSerializer(application)
        return Response(serializer.data, status=status.HTTP_200_OK)
