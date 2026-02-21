# payments/views.py
import stripe
from rest_framework.views import APIView
from rest_framework.response import Response
from django.conf import settings
from django.shortcuts import get_object_or_404

stripe.api_key = settings.STRIPE_SECRET_KEY

from rest_framework.permissions import IsAuthenticated
from django.db import transaction
from wallet.models import Wallet, WalletTransaction
from bookings.models import Booking

class CreatePaymentIntent(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        booking_id = request.data.get("booking_id")
        payment_type = request.data.get("payment_type", "advance") # "advance" or "remaining"
        
        if not booking_id:
            return Response({"error": "booking_id is required"}, status=400)
            
        from bookings.models import Booking
        # Secure the lookup by ensuring the booking belongs to the current user
        booking = get_object_or_404(Booking, id=booking_id, user=request.user)
        
        if payment_type == "advance":
            if booking.is_advance_paid:
                return Response({"error": "Advance already paid."}, status=400)
            amount = int(booking.advance * 100)
        elif payment_type == "remaining":
            if not booking.is_advance_paid:
                return Response({"error": "Advance must be paid first."}, status=400)
            # 1. First check if it's already paid by looking for a successful payment
            from payments.models import Payment
            if Payment.objects.filter(booking=booking, status='succeeded', metadata__payment_type='remaining').exists():
                return Response({"error": "Remaining balance already paid."}, status=400)
            
            # 2. Check price vs advance edge case
            if booking.price and booking.advance and (booking.price - booking.advance) <= 0:
                return Response({"error": "No remaining balance to pay."}, status=400)
            remaining = booking.price - booking.advance
            amount = int(remaining * 100)
        else:
            return Response({"error": "Invalid payment_type."}, status=400)

        intent = stripe.PaymentIntent.create(
            amount=amount,
            currency="inr",
            automatic_payment_methods={"enabled": True},
            metadata={
                "booking_id": booking.id,
                "user_id": request.user.id,
                "payment_type": payment_type
            }
        )

        return Response({
            "client_secret": intent.client_secret
        })

class WalletPay(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        booking_id = request.data.get("booking_id")
        payment_type = request.data.get("payment_type", "advance")
        
        if not booking_id:
            return Response({"error": "booking_id is required"}, status=400)
            
        # Securely fetch the booking
        booking = get_object_or_404(Booking, id=booking_id, user=request.user)
        
        if payment_type == "advance":
            if booking.is_advance_paid:
                return Response({"error": "Advance already paid for this booking."}, status=400)
            amount_to_deduct = booking.advance
        elif payment_type == "remaining":
            if not booking.is_advance_paid:
                return Response({"error": "Advance must be paid first."}, status=400)
            
            from payments.models import Payment
            if Payment.objects.filter(booking=booking, status='succeeded', metadata__payment_type='remaining').exists():
                return Response({"error": "Remaining balance already paid."}, status=400)
            
            amount_to_deduct = booking.price - booking.advance
        else:
            return Response({"error": "Invalid payment_type."}, status=400)
            
        wallet, created = Wallet.objects.get_or_create(user=request.user)
        
        if wallet.balance < amount_to_deduct:
            return Response({"error": f"Insufficient wallet balance. Need ₹{amount_to_deduct}."}, status=400)

        # Proceed with payment
        wallet.balance -= amount_to_deduct
        wallet.save()

        # Record the wallet transaction
        WalletTransaction.objects.create(
            wallet=wallet,
            amount=amount_to_deduct,
            transaction_type='debit',
            description=f"{payment_type.capitalize()} payment for Booking #{booking.id}",
            status='completed'
        )

        # Record in Payment model for consistency (especially for remaining balance calculation)
        from payments.models import Payment
        import uuid
        Payment.objects.create(
            booking=booking,
            stripe_payment_intent_id=f"wallet_{booking.id}_{payment_type}_{uuid.uuid4().hex[:8]}", # Unique ID for wallet
            amount=amount_to_deduct,
            status="succeeded",
            metadata={
                "booking_id": booking.id,
                "user_id": request.user.id,
                "payment_type": payment_type,
                "method": "wallet"
            }
        )

        # Update booking if it was advance
        if payment_type == "advance":
            booking.is_advance_paid = True
            booking.save(update_fields=["is_advance_paid", "updated_at"])
        else:
            booking.save(update_fields=["updated_at"])

        return Response({
            "message": f"{payment_type.capitalize()} payment successful via wallet.",
            "balance": wallet.balance,
            "booking_id": booking.id
        })
