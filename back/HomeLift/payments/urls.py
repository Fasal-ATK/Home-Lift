# payments/urls.py
from django.urls import path,include
from .views import CreatePaymentIntent, WalletPay
from .webhooks import stripe_webhook

urlpatterns = [
    path("create-payment-intent/", CreatePaymentIntent.as_view()),
    path("wallet-pay/", WalletPay.as_view(), name="wallet-pay"),
    path("webhook/", stripe_webhook, name="stripe-webhook"),
]