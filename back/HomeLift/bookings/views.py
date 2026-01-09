# bookings/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, BasePermission
from django.shortcuts import get_object_or_404
from django.db import transaction
from django.db.models import Q

from .models import Booking
from .serializers import BookingSerializer
from core.permissions import IsProviderUser, IsAdminUserCustom

# Provider models
from providers.models import ProviderService


# ---------------------------------------------------------------------------
# Helper permission (provider OR admin)
# ---------------------------------------------------------------------------
class IsProviderOrAdmin(BasePermission):
    """Allow access if the user is a provider OR an admin/staff user."""
    def has_permission(self, request, view):
        u = request.user
        if not (u and u.is_authenticated):
            return False
        return bool(u.is_staff or u.is_superuser or getattr(u, "is_provider", False))


# ---------------------------------------------------------------------------
#  USER VIEW (kept name: BookingListCreateView) → list / create for normal users
# ---------------------------------------------------------------------------
class BookingListCreateView(APIView):
    """
    GET: list bookings created by the authenticated normal user.
    POST: create a booking (normal user).
    Permission: only normal (non-provider, non-staff) users via IsNormalUser.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        qs = Booking.objects.filter(user=user).select_related("service", "provider", "address", "user").order_by("-created_at")
        serializer = BookingSerializer(qs, many=True, context={"request": request})
        return Response(serializer.data, status=status.HTTP_200_OK)

    @transaction.atomic
    def post(self, request):
        serializer = BookingSerializer(data=request.data, context={"request": request})
        if serializer.is_valid():
            booking = serializer.save(user=request.user)
            return Response(
                {"message": "Booking created successfully.",
                 "data": BookingSerializer(booking, context={"request": request}).data},
                status=status.HTTP_201_CREATED,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ---------------------------------------------------------------------------
#  PROVIDER VIEW → provider-specific endpoints (list assigned/owned, pending)
# ---------------------------------------------------------------------------
# use your provider-only permission
from core.permissions import IsProviderUser

class ProviderBookingsView(APIView):
    """
    GET → Return bookings AVAILABLE to this provider:
      - booking.status == "pending"
      - booking.provider IS NULL (unassigned)
      - booking.service in provider's approved services
      - exclude bookings that the provider created (provider as a normal user)
    Permission: provider only.
    """
    permission_classes = [IsProviderUser]

    def get(self, request):
        provider = request.user

        # ensure provider profile exists
        try:
            provider_details = provider.provider_details
        except Exception:
            return Response({"error": "Provider profile not found."}, status=status.HTTP_400_BAD_REQUEST)

        # list of service ids the provider is approved for
        allowed_services = list(provider_details.services.values_list("service_id", flat=True))

        # Query: pending, unassigned, matching allowed services, excluding bookings created by this provider user
        qs = Booking.objects.filter(
            status="pending",
            provider__isnull=True,
            service_id__in=allowed_services
        ).exclude(
            user=provider
        ).select_related("service", "provider", "address", "user").order_by("-created_at")

        serializer = BookingSerializer(qs, many=True, context={"request": request})
        return Response(serializer.data, status=status.HTTP_200_OK)


class ProviderPendingBookingsView(APIView):
    """
    GET: Pending bookings which this provider is eligible to accept.
    Permission: provider only.
    """
    permission_classes = [IsProviderUser]

    def get(self, request):
        user = request.user
        try:
            provider_details = user.provider_details
        except Exception:
            return Response({"error": "Provider profile not found."}, status=status.HTTP_400_BAD_REQUEST)

        allowed_services = provider_details.services.values_list("service_id", flat=True)

        bookings_qs = Booking.objects.filter(
            service_id__in=allowed_services,
            status="pending",
            provider__isnull=True
        ).select_related("service", "user").order_by("-created_at")

        serializer = BookingSerializer(bookings_qs, many=True, context={"request": request})
        return Response(serializer.data, status=status.HTTP_200_OK)


class ProviderAcceptBookingView(APIView):
    """
    POST /provider/bookings/<pk>/accept/
    Provider accepts a pending booking (mark as confirmed & assign provider)
    """
    permission_classes = [IsProviderUser]

    @transaction.atomic
    def post(self, request, pk):
        try:
            booking = Booking.objects.select_for_update().get(pk=pk)
        except Booking.DoesNotExist:
            return Response({"error": "Booking not found."}, status=status.HTTP_404_NOT_FOUND)

        if booking.status != "pending":
            return Response({"error": "Only pending bookings can be accepted."}, status=status.HTTP_400_BAD_REQUEST)

        provider = request.user
        try:
            provider_details = provider.provider_details
        except Exception:
            return Response({"error": "Provider profile not found."}, status=status.HTTP_400_BAD_REQUEST)

        # eligibility check
        if not provider_details.services.filter(service_id=booking.service_id).exists():
            return Response({"error": "You are not approved to accept this service."}, status=status.HTTP_403_FORBIDDEN)

        booking.provider = provider
        booking.status = "confirmed"
        booking.save(update_fields=["provider", "status", "updated_at"])

        return Response({"message": "Booking accepted.", "data": BookingSerializer(booking, context={"request": request}).data}, status=status.HTTP_200_OK)


class ProviderAssignedBookingsView(APIView):
    """
    GET: List all bookings assigned to the authenticated provider.
    Includes confirmed, in_progress, and completed bookings.
    """
    permission_classes = [IsProviderUser]

    def get(self, request):
        provider = request.user
        qs = Booking.objects.filter(
            provider=provider
        ).select_related("service", "address", "user").order_by("-booking_date", "-booking_time")

        serializer = BookingSerializer(qs, many=True, context={"request": request})
        return Response(serializer.data, status=status.HTTP_200_OK)



# ---------------------------------------------------------------------------
#  ADMIN VIEW → admin/staff can list all bookings
# ---------------------------------------------------------------------------
class AdminBookingsView(APIView):
    permission_classes = [IsAdminUserCustom]

    def get(self, request):
        qs = Booking.objects.all().select_related("service", "provider", "address", "user").order_by("-created_at")
        serializer = BookingSerializer(qs, many=True, context={"request": request})
        return Response(serializer.data, status=status.HTTP_200_OK)


# ---------------------------------------------------------------------------
#  COMMON DETAIL / CANCEL (owner OR provider OR admin)
# ---------------------------------------------------------------------------
class BookingDetailUpdateView(APIView):
    """
    GET: detail for booking (allowed for owner, assigned provider, admin)
    DELETE: cancel (soft-cancel) allowed for owner, assigned provider, admin
    """
    permission_classes = [IsAuthenticated]

    def _get_object(self, pk, user):
        # admin can fetch any booking
        if user.is_staff or user.is_superuser:
            return get_object_or_404(Booking, pk=pk)
        # owner
        try:
            return Booking.objects.get(pk=pk, user=user)
        except Booking.DoesNotExist:
            # assigned provider
            return get_object_or_404(Booking, pk=pk, provider=user)

    def get(self, request, pk):
        booking = self._get_object(pk, request.user)
        serializer = BookingSerializer(booking, context={"request": request})
        return Response(serializer.data, status=status.HTTP_200_OK)

    @transaction.atomic 
    def delete(self, request, pk):
        booking = self._get_object(pk, request.user)

        if booking.status == "completed":
            return Response({"error": "Completed bookings cannot be cancelled."}, status=status.HTTP_400_BAD_REQUEST)

        user = request.user
        if not (user.is_staff or user.is_superuser or booking.user == user or booking.provider == user):
            return Response({"error": "Permission denied."}, status=status.HTTP_403_FORBIDDEN)

        booking.status = "cancelled"
        booking.save(update_fields=["status", "updated_at"])

        return Response({"message": "Booking cancelled successfully.", "data": BookingSerializer(booking, context={"request": request}).data}, status=status.HTTP_200_OK)


# ---------------------------------------------------------------------------
#  PROVIDER / ADMIN → UPDATE STATUS
# ---------------------------------------------------------------------------
class BookingStatusUpdateView(APIView):
    """
    PATCH /bookings/<pk>/status/:
    - assigned provider OR admin/staff can update status.
    """
    permission_classes = [IsProviderOrAdmin]

    @transaction.atomic
    def patch(self, request, pk):
        booking = get_object_or_404(Booking, pk=pk)
        user = request.user

        # Only assigned provider OR admin can update
        if not (user.is_staff or user.is_superuser or booking.provider == user):
            return Response({"error": "Not allowed."}, status=status.HTTP_403_FORBIDDEN)

        new_status = (request.data.get("status") or "").strip()
        allowed = {"pending", "confirmed", "in_progress", "completed", "cancelled"}

        if new_status not in allowed:
            return Response({"error": f"Invalid status. Allowed: {sorted(list(allowed))}"}, status=status.HTTP_400_BAD_REQUEST)

        if booking.status == "completed" and new_status != "completed":
            return Response({"error": "Cannot move out of completed status."}, status=status.HTTP_400_BAD_REQUEST)

        booking.status = new_status
        booking.save(update_fields=["status", "updated_at"])

        return Response({"message": "Status updated.", "data": BookingSerializer(booking, context={"request": request}).data}, status=status.HTTP_200_OK)
