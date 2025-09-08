from rest_framework import generics, status
from rest_framework.response import Response
from .models import ProviderApplication, ProviderApplicationService, ProviderDetails, ProviderService
from .serializers import ProviderApplicationSerializer
from core.permissions import IsNormalUser, IsAdminUserCustom

# ------------------------------
# Submit Provider Application
# ------------------------------
class ProviderApplicationCreateView(generics.CreateAPIView):
    queryset = ProviderApplication.objects.all()
    serializer_class = ProviderApplicationSerializer
    permission_classes = [IsNormalUser]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


# ------------------------------
# List Current User Applications
# ------------------------------
class ProviderApplicationListView(generics.ListAPIView):
    serializer_class = ProviderApplicationSerializer
    permission_classes = [IsAdminUserCustom]

    def get_queryset(self):
        return ProviderApplication.objects.filter(user=self.request.user)


# ------------------------------
# Admin: Approve/Reject Application
# ------------------------------
class ProviderApplicationUpdateStatusView(generics.UpdateAPIView):
    queryset = ProviderApplication.objects.all()
    serializer_class = ProviderApplicationSerializer
    permission_classes = [IsAdminUserCustom]
    lookup_field = 'id'

    def patch(self, request, *args, **kwargs):
        instance = self.get_object()
        status_value = request.data.get('status')
        rejection_reason = request.data.get('rejection_reason', '')

        if status_value not in ['approved', 'rejected']:
            return Response({'detail': 'Invalid status'}, status=status.HTTP_400_BAD_REQUEST)

        instance.status = status_value
        instance.rejection_reason = rejection_reason if status_value == 'rejected' else ''
        instance.replied_at = timezone.now()
        instance.save()

        serializer = self.get_serializer(instance)
        return Response(serializer.data)
