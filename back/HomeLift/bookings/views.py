from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from django.shortcuts import get_object_or_404
from django.db import transaction
from .models import Booking
from .serializers import BookingSerializer


class BookingListCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        """List bookings for the logged-in user (or all if admin)."""
        try:
            user = request.user
            if user.is_staff or user.is_superuser:
                bookings = Booking.objects.all()
            else:
                bookings = Booking.objects.filter(user=user)

            serializer = BookingSerializer(bookings, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)

        except Exception as e:
            return Response(
                {"error": f"Failed to fetch bookings: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @transaction.atomic
    def post(self, request):
        """Create a new booking."""
        try:
            serializer = BookingSerializer(data=request.data, context={'request': request})
            if serializer.is_valid():
                booking = serializer.save(user=request.user)
                return Response(
                    {
                        "message": "Booking created successfully.",
                        "data": BookingSerializer(booking).data,
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
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self, pk, user):
        """Fetch booking safely."""
        if user.is_staff or user.is_superuser:
            return get_object_or_404(Booking, pk=pk)
        return get_object_or_404(Booking, pk=pk, user=user)

    def get(self, request, pk):
        """Retrieve a single booking."""
        try:
            booking = self.get_object(pk, request.user)
            serializer = BookingSerializer(booking)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {"error": f"Failed to retrieve booking: {str(e)}"},
                status=status.HTTP_404_NOT_FOUND
            )

    @transaction.atomic
    def patch(self, request, pk):
        """Update booking details (status, time, etc)."""
        try:
            booking = self.get_object(pk, request.user)
            serializer = BookingSerializer(booking, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(
                    {"message": "Booking updated successfully.", "data": serializer.data},
                    status=status.HTTP_200_OK,
                )
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        except Booking.DoesNotExist:
            return Response(
                {"error": "Booking not found."}, status=status.HTTP_404_NOT_FOUND
            )

        except Exception as e:
            transaction.set_rollback(True)
            return Response(
                {"error": f"Error updating booking: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def delete(self, request, pk):
        """Cancel/Delete a booking."""
        try:
            booking = self.get_object(pk, request.user)
            booking.delete()
            return Response(
                {"message": "Booking deleted successfully."},
                status=status.HTTP_204_NO_CONTENT,
            )
        except Exception as e:
            return Response(
                {"error": f"Failed to delete booking: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
