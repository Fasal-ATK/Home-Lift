# payments/urls.py
from django.urls import path,include
from .views import CreatePaymentIntent
from .webhooks import stripe_webhook

urlpatterns = [
    path("create-payment-intent/", CreatePaymentIntent.as_view()),
    path("webhook/", stripe_webhook, name="stripe-webhook"),
]