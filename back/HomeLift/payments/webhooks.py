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
    print("payload")
    print(payload)
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
    except (ValueError, stripe.error.SignatureVerificationError):
        return HttpResponse(status=400)

    if event["type"] == "payment_intent.succeeded":
        intent = event["data"]["object"]
        booking_id = intent.get("metadata", {}).get("booking_id")
        
        if booking_id:
            try:
                from payments.models import Payment
                booking = Booking.objects.get(id=booking_id)
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
                print(f"✅ Booking #{booking_id} marked as paid and payment recorded.")
            except Booking.DoesNotExist:
                print(f"❌ Webhook error: Booking #{booking_id} not found.")
            except Exception as e:
                print(f"❌ Webhook error recording payment: {e}")

    return HttpResponse(status=200)
