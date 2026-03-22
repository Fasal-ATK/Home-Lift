# payments/webhooks.py
import stripe
import json
from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings
from bookings.models import Booking

@csrf_exempt
def stripe_webhook(request):
    payload = request.body
    sig_header = request.META.get("HTTP_STRIPE_SIGNATURE")
    endpoint_secret = getattr(settings, "STRIPE_WEBHOOK_SECRET", None)

    try:
        if endpoint_secret:
            event = stripe.Webhook.construct_event(
                payload, sig_header, endpoint_secret
            )
        else:
            data = json.loads(payload)
            event = data
    except (ValueError, stripe.error.SignatureVerificationError) as e:
        print(f"⚠️ Webhook error: {e}")
        return HttpResponse(status=400)

    if event["type"] == "payment_intent.succeeded":
        intent = event["data"]["object"]
        metadata = intent.get("metadata", {})
        booking_id = metadata.get("booking_id")
        user_id = metadata.get("user_id")
        payment_type = metadata.get("payment_type", "advance")
        
        if booking_id:
            try:
                from payments.models import Payment
                from notifications.utils import send_user_notification
                booking = Booking.objects.get(id=booking_id)
                
                if payment_type == "remaining":
                    booking.save(update_fields=["updated_at"])
                else:
                    booking.is_advance_paid = True
                    booking.save(update_fields=["is_advance_paid", "updated_at"])
                
                # Record the payment
                Payment.objects.update_or_create(
                    stripe_payment_intent_id=intent["id"],
                    defaults={
                        "booking": booking,
                        "amount": intent["amount"] / 100.0,
                        "currency": intent["currency"],
                        "status": "succeeded",
                        "metadata": intent.get("metadata")
                    }
                )
                
                print(f"✅ Booking #{booking_id} marked as paid.")
                if user_id:
                    send_user_notification(user_id, f"Payment of ₹{intent['amount']/100.0} was successful!")

            except Booking.DoesNotExist:
                print(f"❌ Webhook error: Booking #{booking_id} not found.")

    elif event["type"] == "transfer.created":
        # This handles the withdrawal to provider
        transfer = event["data"]["object"]
        metadata = transfer.get("metadata", {})
        # Note: We don't always have user_id in transfer metadata unless we pass it specifically
        print(f"💰 Transfer Created: {transfer['id']} for {transfer['amount']/100.0}")

    return HttpResponse(status=200)
