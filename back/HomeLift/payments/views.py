# payments/views.py
import stripe
from rest_framework.views import APIView
from rest_framework.response import Response
from django.conf import settings
from django.shortcuts import get_object_or_404

stripe.api_key = settings.STRIPE_SECRET_KEY

from rest_framework.permissions import IsAuthenticated

class CreatePaymentIntent(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        booking_id = request.data.get("booking_id")
        if not booking_id:
            return Response({"error": "booking_id is required"}, status=400)
            
        from bookings.models import Booking
        # Secure the lookup by ensuring the booking belongs to the current user
        booking = get_object_or_404(Booking, id=booking_id, user=request.user)
        
        # Stripe expects amount in smallest currency unit (paise for INR)
        amount = int(booking.advance * 100)

        intent = stripe.PaymentIntent.create(
            amount=amount,
            currency="inr",
            automatic_payment_methods={"enabled": True},
            metadata={
                "booking_id": booking.id,
                "user_id": request.user.id
            }
        )

        return Response({
            "client_secret": intent.client_secret
        })
