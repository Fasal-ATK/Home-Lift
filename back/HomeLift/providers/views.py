from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from .models import ProviderApplication
from .serializers import ProviderApplicationSerializer
from core.permissions import IsNormalUser, IsAdminUserCustom, IsProviderUser
import logging
import json

logger = logging.getLogger(__name__)

# ------------------------------
# Submit Provider Application
# ------------------------------
class ProviderApplicationCreateAPIView(APIView):
    permission_classes = [IsNormalUser]

    def post(self, request, *args, **kwargs):
        # 🔍 View-level guard
        if ProviderApplication.objects.filter(
            user=request.user,
            status__in=["pending", "approved"]
        ).exists():
            return Response(
                {"detail": "You already have an active or pending application."},
                status=status.HTTP_400_BAD_REQUEST
            )

        services_json = request.data.get("services")
        if services_json:
            try:
                services = json.loads(services_json)
                for i, service in enumerate(services):
                    file_key = f"service_doc_{i}"
                    if file_key in request.FILES:
                        service["id_doc"] = request.FILES[file_key]
            except Exception as e:
                return Response({"services": [f"Invalid format: {e}"]}, status=400)
        else:
            services = []

        payload = {
            "id_doc": request.FILES.get("id_doc"),
            "services": services,
            "user": request.user.id,
        }

        serializer = ProviderApplicationSerializer(
            data=payload, context={"request": request}
        )
        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ProviderApplicationStatusView(APIView):
    permission_classes = [IsNormalUser | IsProviderUser]

    def get(self, request, *args, **kwargs):
        # Get the latest application for the user
        application = ProviderApplication.objects.filter(user=request.user).order_by('-created_at').first()
        
        if not application:
            # No application exists
            return Response({
                "status": None,
                "rejection_reason": None
            }, status=status.HTTP_200_OK)

        # Use serializer for validation/formatting but only return needed fields
        serializer = ProviderApplicationSerializer(application, context={"request": request})
        data = serializer.data

        response_data = {
            "status": data["status"],
            "rejection_reason": data["rejection_reason"]
        }

        return Response(response_data, status=status.HTTP_200_OK)








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
