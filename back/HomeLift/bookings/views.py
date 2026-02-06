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
        from core.pagination import LargeResultsSetPagination
        user = request.user
        qs = Booking.objects.filter(user=user).select_related("service", "provider", "address", "user")

        # Basic filtering
        status_param = request.query_params.get('status')
        if status_param and status_param != 'all':
            qs = qs.filter(status=status_param)

        search_query = request.query_params.get('search')
        if search_query:
            qs = qs.filter(
                Q(service__name__icontains=search_query) | 
                Q(provider__user__first_name__icontains=search_query) |
                Q(provider__user__username__icontains=search_query) |
                Q(id__icontains=search_query)
            )

        # Category filtering
        category = request.query_params.get('category')
        if category:
            qs = qs.filter(service__category__id=category)

        # Date filtering
        date_from = request.query_params.get('date_from')
        date_to = request.query_params.get('date_to')
        if date_from:
            qs = qs.filter(created_at__date__gte=date_from)
        if date_to:
            qs = qs.filter(created_at__date__lte=date_to)

        # Ordering
        ordering = request.query_params.get('ordering', '-created_at')
        # Map frontend sort keys if necessary, or just expect model fields
        # Frontend sends: "date_desc", "date_asc", "price_desc", "price_asc"
        if ordering == 'date_desc':
            qs = qs.order_by('-created_at')
        elif ordering == 'date_asc':
            qs = qs.order_by('created_at')
        elif ordering == 'price_desc':
            qs = qs.order_by('-price')
        elif ordering == 'price_asc':
            qs = qs.order_by('price')
        else:
            qs = qs.order_by('-created_at')

        paginator = LargeResultsSetPagination()
        result_page = paginator.paginate_queryset(qs, request)
        serializer = BookingSerializer(result_page, many=True, context={"request": request})
        return paginator.get_paginated_response(serializer.data)

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

        # Query: pending, unassigned, matching allowed services, PAID, excluding bookings created by this provider user
        qs = Booking.objects.filter(
            status="pending",
            provider__isnull=True,
            service_id__in=allowed_services,
            is_advance_paid=True  # Only show paid bookings to providers
        ).exclude(
            user=provider
        ).select_related("service", "provider", "address", "user").order_by("-created_at")

        # Filtering
        service_filter = request.query_params.get('service')
        if service_filter and service_filter != 'All Services':
             # assuming service_filter is name, but ideally should be ID. 
             # Frontend (JobRequests.jsx) sends name e.g. "Plumbing" or "All Services".
             # Backend model Service has 'name'.
             qs = qs.filter(service__name__iexact=service_filter)

        search_query = request.query_params.get('search')
        if search_query:
            qs = qs.filter(
                Q(user__first_name__icontains=search_query) |
                Q(user__username__icontains=search_query) |
                Q(service__name__icontains=search_query) |
                Q(address__city__icontains=search_query) |
                Q(id__icontains=search_query)
            )

        from core.pagination import LargeResultsSetPagination
        paginator = LargeResultsSetPagination()
        result_page = paginator.paginate_queryset(qs, request)
        serializer = BookingSerializer(result_page, many=True, context={"request": request})
        return paginator.get_paginated_response(serializer.data)


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

        # ✅ Overlap Check
        # Check if this provider already has a confirmed/in_progress booking at the same date & time
        # Assuming fixed 1-hour duration (3600 seconds)
        overlapping_bookings = Booking.objects.filter(
            provider=provider,
            booking_date=booking.booking_date,
            booking_time=booking.booking_time,
            status__in=["confirmed", "in_progress"]
        ).exists()

        if overlapping_bookings:
            return Response(
                {"error": "You already have a confirmed or in-progress booking at this time."},
                status=status.HTTP_400_BAD_REQUEST
            )

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
        from core.pagination import LargeResultsSetPagination
        from django.db.models import Q
        
        qs = Booking.objects.all().select_related("service", "provider", "address", "user").order_by("-created_at")

        # Search
        search_query = request.query_params.get('search')
        if search_query:
            qs = qs.filter(
                Q(service__name__icontains=search_query) |
                Q(provider__user__username__icontains=search_query) |
                Q(user__username__icontains=search_query) |
                Q(id__icontains=search_query)
            )

        # Status
        status_param = request.query_params.get('status')
        if status_param and status_param != 'all':
            qs = qs.filter(status=status_param)

        # Date filtering
        date_from = request.query_params.get('date_from')
        date_to = request.query_params.get('date_to')
        if date_from:
            qs = qs.filter(created_at__date__gte=date_from)
        if date_to:
            qs = qs.filter(created_at__date__lte=date_to)

        paginator = LargeResultsSetPagination()
        result_page = paginator.paginate_queryset(qs, request)
        serializer = BookingSerializer(result_page, many=True, context={"request": request})
        return paginator.get_paginated_response(serializer.data)


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


# ---------------------------------------------------------------------------
#  INVOICE DOWNLOAD
# ---------------------------------------------------------------------------
class DownloadInvoiceView(APIView):
    """
    GET /bookings/<pk>/invoice/
    Download booking invoice as PDF.
    Allowed for: Owner, Assigned Provider, Admin.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        from django.http import HttpResponse
        from core.utils import generate_invoice_pdf
        
        # Fetch object with permission check
        user = request.user
        booking = get_object_or_404(Booking, pk=pk)

        # Check permissions: Admin, Owner, or Assigned Provider
        is_owner = booking.user == user
        is_provider = booking.provider == user
        is_admin = user.is_staff or user.is_superuser

        if not (is_owner or is_provider or is_admin):
            return Response({"error": "Permission denied."}, status=status.HTTP_403_FORBIDDEN)

        # Generate PDF
        try:
            pdf_buffer = generate_invoice_pdf(booking)
        except Exception as e:
            return Response({"error": f"Error generating PDF: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # Return response
        filename = f"Invoice_Booking_{booking.id}.pdf"
        response = HttpResponse(pdf_buffer, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response
