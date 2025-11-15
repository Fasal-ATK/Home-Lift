# bookings/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from django.shortcuts import get_object_or_404
from django.db import transaction
from django.db.models import F

from .models import Booking
from .serializers import BookingSerializer

# import your permission classes
from core.permissions import IsNormalUser, IsProviderUser, IsAdminUserCustom

# services
from services.models import Service
# Ensure you have a ServiceSerializer in services/serializers.py that serializes the fields you need.
from services.serializers import ServiceSerializer


class BookingListCreateView(APIView):
    # permission_classes should be an iterable of permission classes
    permission_classes = [IsNormalUser | IsProviderUser]

    def get(self, request):
        """List bookings for the logged-in user (or all if admin)."""
        try:
            user = request.user
            if user.is_staff or user.is_superuser:
                bookings = Booking.objects.all()
            else:
                bookings = Booking.objects.filter(user=user)

            serializer = BookingSerializer(bookings, many=True, context={"request": request})
            return Response(serializer.data, status=status.HTTP_200_OK)

        except Exception as e:
            return Response(
                {"error": f"Failed to fetch bookings: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    @transaction.atomic
    def post(self, request):
        """Create a new booking."""
        try:
            serializer = BookingSerializer(data=request.data, context={'request': request})
            # If your serializer expects user from context, ensure serializer.create handles it.
            if serializer.is_valid():
                # prefer serializer.save() and let serializer use context or passed fields
                booking = serializer.save(user=request.user) if "user" in serializer.fields else serializer.save()
                return Response(
                    {
                        "message": "Booking created successfully.",
                        "data": BookingSerializer(booking, context={"request": request}).data,
                    },
                    status=status.HTTP_201_CREATED,
                )
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            transaction.set_rollback(True)
            return Response(
                {"error": f"Error creating booking: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class BookingDetailUpdateView(APIView):
    permission_classes = [IsNormalUser | IsProviderUser ]

    def get_object(self, pk, user):
        """Fetch booking safely."""
        if user.is_staff or user.is_superuser:
            return get_object_or_404(Booking, pk=pk)
        return get_object_or_404(Booking, pk=pk, user=user)

    def get(self, request, pk):
        """Retrieve a single booking."""
        try:
            booking = self.get_object(pk, request.user)
            serializer = BookingSerializer(booking, context={"request": request})
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {"error": f"Failed to retrieve booking: {str(e)}"},
                status=status.HTTP_404_NOT_FOUND,
            )

    # @transaction.atomic
    # def patch(self, request, pk):
    #     """Update booking details (status, time, etc)."""
    #     try:
    #         booking = self.get_object(pk, request.user)
    #         serializer = BookingSerializer(booking, data=request.data, partial=True, context={"request": request})
    #         if serializer.is_valid():
    #             serializer.save()
    #             return Response(
    #                 {"message": "Booking updated successfully.", "data": serializer.data},
    #                 status=status.HTTP_200_OK,
    #             )
    #         return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    #     except Booking.DoesNotExist:
    #         return Response({"error": "Booking not found."}, status=status.HTTP_404_NOT_FOUND)

    #     except Exception as e:
    #         transaction.set_rollback(True)
    #         return Response(
    #             {"error": f"Error updating booking: {str(e)}"},
    #             status=status.HTTP_500_INTERNAL_SERVER_ERROR,
    #         )

    @transaction.atomic
    def delete(self, request, pk):
        """
        User cancels their booking (soft cancel).
        - Only booking owner or staff/admin can cancel.
        - Prevent cancelling completed bookings.
        """
        try:
            booking = self.get_object(pk, request.user)  # re-uses existing access control

            # Prevent cancelling a completed booking
            if booking.status == "completed":
                return Response(
                    {"error": "Completed bookings cannot be cancelled."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Optional business rule: only pending/confirmed/in_progress/cancelled can be cancelled by user
            if booking.status not in {"pending", "confirmed", "in_progress", "cancelled"}:
                # If you have other custom statuses, adjust accordingly
                pass

            booking.status = "cancelled"
            booking.save(update_fields=["status", "updated_at"])

            return Response(
                {
                    "message": "Booking cancelled successfully.",
                    "data": BookingSerializer(booking, context={"request": request}).data,
                },
                status=status.HTTP_200_OK,
            )

        except Booking.DoesNotExist:
            return Response({"error": "Booking not found."}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            transaction.set_rollback(True)
            return Response({"error": f"Failed to cancel booking: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ---------- Provider accepts a booking (assign provider + confirm) ----------

class ProviderAcceptBookingView(APIView):
    """
    POST /api/provider/bookings/<pk>/accept/
    - Provider must be authenticated & have provider permission.
    - Booking must be pending.
    - Assigns request.user as provider and marks status 'confirmed'.
    """
    permission_classes = [IsProviderUser]

    @transaction.atomic
    def post(self, request, pk):
        try:
            # Use select_for_update to lock the row and avoid race conditions
            try:
                booking = Booking.objects.select_for_update().get(pk=pk)
            except Booking.DoesNotExist:
                return Response({"error": "Booking not found."}, status=status.HTTP_404_NOT_FOUND)

            # Only allow accepting if booking is still pending
            if getattr(booking, "status", "pending") != "pending":
                return Response(
                    {"error": "Only bookings with status 'pending' can be accepted."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # If already assigned to a different provider, block
            if booking.provider and booking.provider != request.user:
                return Response(
                    {"error": "Booking already assigned to another provider."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Optional: check provider is allowed to accept this service
            # e.g., if you have a ProviderService mapping you could verify here.
            # if not request.user.provided_services.filter(id=booking.service_id).exists():
            #     return Response({"error": "You are not eligible to accept this service."}, status=status.HTTP_403_FORBIDDEN)

            # Assign provider and update status
            booking.provider = request.user
            booking.status = "confirmed"
            booking.save(update_fields=["provider", "status", "updated_at"])

            serializer = BookingSerializer(booking, context={"request": request})
            return Response(
                {"message": "Booking accepted by provider.", "data": serializer.data},
                status=status.HTTP_200_OK,
            )

        except Exception as e:
            transaction.set_rollback(True)
            return Response(
                {"error": f"Failed to accept booking: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


# ---------- Provider / Admin status update endpoint ----------

class BookingStatusUpdateView(APIView):
    """
    PATCH /api/bookings/<pk>/status/
    - Allows assigned provider or admin/staff to change the booking.status.
    - Body: { "status": "<new_status>" }
    """
    permission_classes = [permissions.IsAuthenticated]  # additional checks inside

    @transaction.atomic
    def patch(self, request, pk):
        try:
            booking = get_object_or_404(Booking, pk=pk)

            # Only the assigned provider or admin/staff can update status here
            user = request.user
            if not (user.is_staff or user.is_superuser or booking.provider == user):
                return Response(
                    {"error": "You do not have permission to update the status of this booking."},
                    status=status.HTTP_403_FORBIDDEN,
                )

            new_status = (request.data.get("status") or "").strip()
            if not new_status:
                return Response({"error": "Missing 'status' in request body."}, status=status.HTTP_400_BAD_REQUEST)

            # whitelist allowed statuses (keep in sync with your model choices)
            allowed_statuses = {"pending", "confirmed", "in_progress", "completed", "cancelled"}
            if new_status not in allowed_statuses:
                return Response(
                    {"error": f"Invalid status. Allowed: {sorted(list(allowed_statuses))}"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # business rule: cannot transition out of completed
            if booking.status == "completed" and new_status != "completed":
                return Response(
                    {"error": "Cannot transition out of 'completed' state."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            booking.status = new_status
            booking.save(update_fields=["status", "updated_at"])

            serializer = BookingSerializer(booking, context={"request": request})
            return Response(
                {"message": "Booking status updated successfully.", "data": serializer.data},
                status=status.HTTP_200_OK,
            )

        except Booking.DoesNotExist:
            return Response({"error": "Booking not found."}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            transaction.set_rollback(True)
            return Response(
                {"error": f"Failed to update booking status: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

